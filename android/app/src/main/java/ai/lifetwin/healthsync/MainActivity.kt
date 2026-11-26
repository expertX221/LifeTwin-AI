package ai.lifetwin.healthsync

import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    private lateinit var status: TextView
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var foregroundJob: Job? = null
    private val scan = registerForActivityResult(ScanContract()) { result ->
        val content = result.contents ?: return@registerForActivityResult
        try {
            val value = JSONObject(content)
            val api = value.getString("api")
            require(value.optInt("v") == 1 && api.startsWith("https://"))
            require(value.getString("token").length == 43 && value.getString("key").length == 43)
            PairingStore.save(this, value)
            status.text = "LifeTwin paired. Grant Health Connect access, then leave this app open for frequent sync."
        } catch (_: Exception) { status.text = "That QR code is not a valid LifeTwin pairing code." }
    }
    private val permissionRequest = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        val missing = HealthUploader.recordPermissions - granted
        if (missing.isEmpty()) {
            status.text = "Health Connect access granted. Syncing readings to LifeTwin."
            startForegroundSync()
            requestBackgroundPermission()
        } else status.text = "Some access was declined. LifeTwin can only sync the data types you allowed."
    }
    private val backgroundRequest = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        if (HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND in granted) {
            status.text = "Background reading is allowed. Android will sync about every 15 minutes."
            scheduleBackgroundSync()
        } else status.text = "Foreground sync is active. Background reading was not allowed."
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildScreen()
    }

    private fun buildScreen() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(28, 36, 28, 24)
            setBackgroundColor(0xFF0A0A0A.toInt())
        }
        fun text(value: String, size: Float, color: Int = 0xFFFFFFFF.toInt()) = TextView(this).apply {
            this.text = value; textSize = size; setTextColor(color); setPadding(0, 8, 0, 8)
        }
        root.addView(text("LifeTwin Health Sync", 26f, 0xFF39FF14.toInt()))
        root.addView(text("Private phone bridge for heart rate, oxygen and sleep", 15f, 0xFFA1A1AA.toInt()))
        status = text(if (PairingStore.load(this) == null) "Pair this phone with the laptop dashboard." else "Paired. Grant Health Connect access to start.", 15f)
        root.addView(status)
        fun button(label: String, action: () -> Unit) {
            root.addView(Button(this).apply { text = label; setOnClickListener { action() } })
        }
        button("Scan LifeTwin pairing QR") {
            scan.launch(ScanOptions().setDesiredBarcodeFormats(ScanOptions.QR_CODE).setPrompt("Scan the QR shown on LifeTwin").setBeepEnabled(false).setOrientationLocked(false))
        }
        button("Grant heart, oxygen and sleep access") { requestRecordPermissions() }
        button("Sync now") { syncNow() }
        button("Disconnect this phone") {
            PairingStore.clear(this)
            WorkManager.getInstance(this).cancelUniqueWork("lifetwin-health-sync")
            foregroundJob?.cancel()
            status.text = "Disconnected. The phone pairing key was erased."
        }
        root.addView(text("Health Connect updates can be delayed until Fastrack Smart World syncs the watch. Keep this app open for the fastest updates. Background sync runs about every 15 minutes when Android grants background access.", 13f, 0xFFA1A1AA.toInt()))
        setContentView(root)
    }

    private fun requestRecordPermissions() {
        val providerStatus = HealthConnectClient.getSdkStatus(this, "com.google.android.apps.healthdata")
        if (providerStatus != HealthConnectClient.SDK_AVAILABLE) {
            status.text = "Install or update Health Connect from Google Play, then try again."
            return
        }
        permissionRequest.launch(HealthUploader.recordPermissions)
    }

    private fun requestBackgroundPermission() {
        try {
            val client = HealthConnectClient.getOrCreate(this)
            if (client.features.getFeatureStatus(HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND) == HealthConnectFeatures.FEATURE_STATUS_AVAILABLE) {
                backgroundRequest.launch(setOf(HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND))
            } else status.text = "Foreground sync is active. This Health Connect version does not offer background reads."
        } catch (_: Exception) { status.text = "Foreground sync is active; background permission is unavailable." }
    }

    private fun startForegroundSync() {
        foregroundJob?.cancel()
        foregroundJob = scope.launch {
            while (isActive) {
                syncNow()
                delay(30_000)
            }
        }
    }

    private fun syncNow() {
        scope.launch {
            status.text = "Checking Health Connect…"
            try {
                val sent = withContext(Dispatchers.IO) { HealthUploader.sync(this@MainActivity) }
                status.text = if (sent) "Encrypted snapshot sent to LifeTwin · ${java.time.LocalTime.now().withSecond(0).withNano(0)}" else "Pair LifeTwin and grant Health Connect access first."
                scheduleBackgroundSync()
            } catch (_: Exception) { status.text = "Sync paused. Check Health Connect permissions and your internet connection." }
        }
    }

    private fun scheduleBackgroundSync() {
        scope.launch(Dispatchers.IO) {
            try {
                val granted = HealthConnectClient.getOrCreate(this@MainActivity).permissionController.getGrantedPermissions()
                if (HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND !in granted) return@launch
                val work = PeriodicWorkRequestBuilder<HealthSyncWorker>(15, TimeUnit.MINUTES).build()
                WorkManager.getInstance(this@MainActivity).enqueueUniquePeriodicWork("lifetwin-health-sync", ExistingPeriodicWorkPolicy.UPDATE, work)
            } catch (_: Exception) { }
        }
    }

    override fun onResume() {
        super.onResume()
        if (PairingStore.load(this) != null) startForegroundSync()
    }

    override fun onPause() {
        foregroundJob?.cancel()
        super.onPause()
    }
}
