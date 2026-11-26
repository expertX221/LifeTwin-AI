package ai.lifetwin.healthsync

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONObject
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

object PairingStore {
    private const val alias = "lifetwin-pairing-v1"
    private const val prefs = "lifetwin-private"
    private const val item = "pairing"

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(alias, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build())
        return generator.generateKey()
    }

    fun save(context: Context, value: JSONObject) {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
        val encrypted = cipher.doFinal(value.toString().toByteArray(Charsets.UTF_8))
        val encoder = Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
        val packed = Base64.encodeToString(cipher.iv, encoder) + "." + Base64.encodeToString(encrypted, encoder)
        context.getSharedPreferences(prefs, Context.MODE_PRIVATE).edit().putString(item, packed).apply()
    }

    fun load(context: Context): JSONObject? {
        return try {
            val packed = context.getSharedPreferences(prefs, Context.MODE_PRIVATE).getString(item, null) ?: return null
            val parts = packed.split('.', limit = 2)
            if (parts.size != 2) return null
            val decoder = Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key(), javax.crypto.spec.GCMParameterSpec(128, Base64.decode(parts[0], decoder)))
            JSONObject(String(cipher.doFinal(Base64.decode(parts[1], decoder)), Charsets.UTF_8))
        } catch (_: Exception) { null }
    }

    fun clear(context: Context) {
        context.getSharedPreferences(prefs, Context.MODE_PRIVATE).edit().remove(item).apply()
        try { KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(alias) } } catch (_: Exception) { }
    }
}
