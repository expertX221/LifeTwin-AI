package ai.lifetwin.healthsync

import android.content.Context
import android.util.Base64
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Duration
import java.time.Instant
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

object HealthUploader {
    val recordPermissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class)
    )

    suspend fun sync(context: Context): Boolean {
        val pair = PairingStore.load(context) ?: return false
        val api = pair.optString("api")
        if (!api.startsWith("https://")) return false
        val client = HealthConnectClient.getOrCreate(context)
        val granted = client.permissionController.getGrantedPermissions()
        if (recordPermissions.intersect(granted).isEmpty()) return false
        val from = Instant.now().minus(Duration.ofDays(7))
        val now = Instant.now()
        val heart = if (HealthPermission.getReadPermission(HeartRateRecord::class) in granted) {
            client.readRecords(ReadRecordsRequest<HeartRateRecord>(timeRangeFilter = TimeRangeFilter.between(from, now)))
                .records.flatMap { it.samples }.maxByOrNull { it.time }
        } else null
        val oxygen = if (HealthPermission.getReadPermission(OxygenSaturationRecord::class) in granted) {
            client.readRecords(ReadRecordsRequest<OxygenSaturationRecord>(timeRangeFilter = TimeRangeFilter.between(from, now)))
                .records.maxByOrNull { it.time }
        } else null
        val sleep = if (HealthPermission.getReadPermission(SleepSessionRecord::class) in granted) {
            client.readRecords(ReadRecordsRequest<SleepSessionRecord>(timeRangeFilter = TimeRangeFilter.between(now.minus(Duration.ofDays(30)), now)))
                .records.maxByOrNull { it.endTime }
        } else null
        val json = JSONObject()
            .put("heartRate", heart?.beatsPerMinute?.toInt() ?: JSONObject.NULL)
            .put("heartRateAt", heart?.time?.toString() ?: JSONObject.NULL)
            .put("oxygen", oxygen?.percentage?.value?.let { kotlin.math.round(it * 10.0) / 10.0 } ?: JSONObject.NULL)
            .put("oxygenAt", oxygen?.time?.toString() ?: JSONObject.NULL)
            .put("sleepMinutes", sleep?.let { Duration.between(it.startTime, it.endTime).toMinutes() } ?: JSONObject.NULL)
            .put("sleepStart", sleep?.startTime?.toString() ?: JSONObject.NULL)
            .put("sleepEnd", sleep?.endTime?.toString() ?: JSONObject.NULL)
            .put("collectedAt", Instant.now().toString())
        val keyBytes = Base64.decode(pair.getString("key"), Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(keyBytes, "AES"))
        val encrypted = cipher.doFinal(json.toString().toByteArray(Charsets.UTF_8))
        val encoder = Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
        val body = JSONObject()
            .put("iv", Base64.encodeToString(cipher.iv, encoder))
            .put("ciphertext", Base64.encodeToString(encrypted, encoder))
            .toString()
        val connection = URL(api).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 12000
            connection.readTimeout = 12000
            connection.doOutput = true
            connection.setRequestProperty("Authorization", "Bearer ${pair.getString("token")}")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            if (connection.responseCode !in 200..299) throw IllegalStateException("LifeTwin sync returned ${connection.responseCode}")
            return true
        } finally { connection.disconnect() }
    }
}
