# @eluter/security-encrypt

Small CLI to encrypt vulnerability reports with OpenPGP for Eluter's security
team. It's a convenience wrapper around `gpg`: handy when you don't have gpg
installed, since it runs straight from npx. The documented way to send us a
report is still gpg (see below).

It's meant to be used with Eluter's
[responsible disclosure policy](https://eluter.com/security).

## English

### What it does

Takes a file (usually a `.zip` with your report) and produces an
ASCII-armored OpenPGP file next to it:

```
report.zip        →        report.zip.asc
```

Attach the `.asc` to an email to [security@eluter.com](mailto:security@eluter.com).

### What it doesn't do

- No network access. Eluter's public key is compiled into the package. The CLI
  never downloads anything and never makes an HTTP request.
- No private keys. It doesn't read, write, import or manage private keys. It
  only encrypts, so it can't decrypt.
- No telemetry. It collects and sends nothing.
- No archiving. It won't zip a directory for you — compress first, then encrypt.

### The canonical way (gpg)

Prefer gpg? Use the key published on
[security.txt](https://eluter.com/.well-known/security.txt):

```sh
# 1) (once) Import Eluter's public key
gpg --keyserver keys.openpgp.org --recv-keys <KEYID>

# 2) Compress your report
zip -r report.zip report/

# 3) Encrypt it for security@eluter.com
gpg --encrypt --armor --recipient security@eluter.com --output report.zip.asc report.zip

# 4) Attach report.zip.asc to an email to security@eluter.com
```

### The convenient way (npx)

No gpg and no installation:

```sh
npx @eluter/security-encrypt report.zip
# → report.zip.asc
```

Or install globally:

```sh
npm install --global @eluter/security-encrypt
security-encrypt report.zip
```

Other commands:

```sh
security-encrypt --fingerprint   # prints fingerprint + verification link
security-encrypt --help          # usage
```

Example output:

```
✓ Encrypted for:    security@eluter.com
✓ Recipient key fingerprint:
      846166114102386d42afe2e6721de15280e05b50
      Verify at: https://eluter.com/.well-known/security.txt
✓ Generated:        report.zip.asc

Next step: attach "report.zip.asc" to an email to security@eluter.com.
```

### Fingerprint

```
846166114102386d42afe2e6721de15280e05b50
```

> **Development placeholder.** The key embedded in the published package is a
> throwaway generated for this project. Don't send real reports to it. It will
> be swapped for Eluter's production key before release. Re-check the
> fingerprint against the published
> [security.txt](https://eluter.com/.well-known/security.txt) before trusting it
> with sensitive content.

### Links

- Responsible disclosure: <https://eluter.com/security>
- Public key & fingerprint: <https://eluter.com/.well-known/security.txt>
- Encrypted reports to: <security@eluter.com>

### Key rotation

Eluter rotates its PGP key from time to time. When a new key is issued, the new
public key and its fingerprint go up on
[security.txt](https://eluter.com/.well-known/security.txt), and this package is
republished with the new key embedded. If the embedded key and the embedded
fingerprint ever disagree, the CLI refuses to encrypt.

---

## Español

### Qué hace

Toma un archivo (generalmente un `.zip` con tu reporte) y genera un archivo
OpenPGP en ASCII-armored al lado:

```
report.zip        →        report.zip.asc
```

Adjuntá el `.asc` a un mail a [security@eluter.com](mailto:security@eluter.com).

### Qué no hace

- Sin red. La clave pública de Eluter está compilada dentro del paquete. El CLI
  nunca descarga nada ni hace requests HTTP.
- Sin claves privadas. No lee, escribe, importa ni gestiona claves privadas.
  Solo cifra, así que no puede descifrar.
- Sin telemetría. No recopila ni envía nada.
- Sin compresión. No comprime directorios por vos — primero comprimí, después
  cifrá.

### La vía canónica (gpg)

¿Preferís gpg? Usá la clave publicada en
[security.txt](https://eluter.com/.well-known/security.txt):

```sh
# 1) (una vez) Importar la clave pública de Eluter
gpg --keyserver keys.openpgp.org --recv-keys <KEYID>

# 2) Comprimir el reporte
zip -r report.zip report/

# 3) Cifrarlo para security@eluter.com
gpg --encrypt --armor --recipient security@eluter.com --output report.zip.asc report.zip

# 4) Adjuntar report.zip.asc a un mail a security@eluter.com
```

### La vía cómoda (npx)

Sin gpg y sin instalación:

```sh
npx @eluter/security-encrypt report.zip
# → report.zip.asc
```

O instalalo global:

```sh
npm install --global @eluter/security-encrypt
security-encrypt report.zip
```

Otros comandos:

```sh
security-encrypt --fingerprint   # imprime fingerprint + link de verificación
security-encrypt --help          # uso
```

### Fingerprint

```
846166114102386d42afe2e6721de15280e05b50
```

> **Placeholder de desarrollo.** La clave embebida en el paquete publicado es
> descartable, generada para este proyecto. No envíes reportes reales a esa
> clave. Se reemplazará por la clave de producción de Eluter antes del release.
> Revisá el fingerprint contra el
> [security.txt](https://eluter.com/.well-known/security.txt) publicado antes de
> confiarle contenido sensible.

### Links

- Divulgación responsable: <https://eluter.com/security>
- Clave pública y fingerprint: <https://eluter.com/.well-known/security.txt>
- Reportes cifrados a: <security@eluter.com>

### Rotación de claves

Eluter rota su clave PGP periódicamente. Cuando se emite una nueva, la clave y
su fingerprint se publican en
[security.txt](https://eluter.com/.well-known/security.txt), y este paquete se
republica con la nueva clave embebida. Si la clave embebida y el fingerprint
embebido dejan de coincidir, el CLI se niega a cifrar.
