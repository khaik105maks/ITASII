# Ізольований SFTP для ITASII (Debian 13)

Команди нижче виконуються на сервері під root. Не закривайте поточне
адміністративне SSH-підключення до перевірки нового входу.
Це ручне одноразове налаштування; GitHub Actions його не виконує.

## Каталоги та користувач

```sh
id itasii-deploy >/dev/null 2>&1 || adduser --disabled-password --gecos '' itasii-deploy
usermod --shell /usr/sbin/nologin itasii-deploy
install -d -o root -g root -m 755 /var/www/itasii
install -d -o itasii-deploy -g itasii-deploy -m 755 /var/www/itasii/public
namei -l /var/www/itasii
```

Усі компоненти шляху chroot (`/`, `/var`, `/var/www`, `/var/www/itasii`)
повинні належати root і не дозволяти запис групі чи іншим користувачам.
Не виконуйте `chown -R itasii-deploy /var/www/itasii`: корінь ізоляції
має залишатися root-owned. Не додавайте цього користувача в sudo-групу.

Якщо файли сайту вже лежать безпосередньо в `/var/www/itasii`, перенесіть
тільки HTML, CSS, JavaScript та `assets/` у `public/`, спочатку зробивши
резервну копію. Приберіть з кореня ізоляції решту непублічних файлів:
усе всередині нього доступне для читання через SFTP, якщо дозволяють права.
Не монтуйте туди інші каталоги сервера.

## Ключ

На Mac створіть ключ, якщо його ще немає:

```sh
ssh-keygen -t ed25519 -C github-itasii -f ~/.ssh/itasii_github_actions -N ''
pbcopy < ~/.ssh/itasii_github_actions.pub
```

На сервері:

```sh
install -d -o root -g root -m 755 /etc/ssh/authorized_keys
touch /etc/ssh/authorized_keys/itasii-deploy
chown root:root /etc/ssh/authorized_keys/itasii-deploy
chmod 644 /etc/ssh/authorized_keys/itasii-deploy
nano /etc/ssh/authorized_keys/itasii-deploy
```

Додайте публічний ключ одним рядком: `restrict ssh-ed25519 AAAA... github-itasii`.
Ключ у старому домашньому `authorized_keys` цей конфіг не використовує.
Файл містить публічний ключ: права 644 дозволяють SSH прочитати його від
імені користувача, а власник root залишає право змінювати його тільки адміністратору.

## Конфіг OpenSSH

Скопіюйте вміст `deploy/itasii-sftp.conf` у новий файл
`/etc/ssh/sshd_config.d/00-itasii-sftp.conf` (root:root, 644).
Перевірте, що `/etc/ssh/sshd_config` включає `/etc/ssh/sshd_config.d/*.conf`.

```sh
/usr/sbin/sshd -t
/usr/sbin/sshd -T -C user=itasii-deploy,host=localhost,addr=127.0.0.1 | grep -E 'chrootdirectory|forcecommand|authorizedkeysfile|disableforwarding|permittty|authenticationmethods'
```

Очікуйте chroot `/var/www/itasii`, команду `internal-sftp -d /public -u 0022`,
ключі `/etc/ssh/authorized_keys/%u`, forwarding/TTY `no` (disableforwarding `yes`),
authenticationmethods `publickey`. Якщо результат інший, не перезавантажуйте
SSH: перевірте конфлікти з іншими Match-блоками.

Після успішних перевірок:

```sh
systemctl reload ssh
```

Match обмежує лише нові сесії `itasii-deploy`. Якщо користувач уже мав
активні підключення до зміни конфігурації, завершіть їх перед перевіркою:
`pkill -u itasii-deploy` (код 1 означає, що процесів не було).

## Перевірка з Mac

```sh
sftp -i ~/.ssh/itasii_github_actions itasii-deploy@202.61.242.104
```

У SFTP `pwd` має показати `/public`. Перевірте:

```text
ls /
cd /../../
pwd
ls /etc
mkdir /test-outside
cd /public
mkdir test-upload
rmdir test-upload
bye
```

`pwd` після `cd /../../` залишається `/`; `/etc` недоступний;
створення `/test-outside` заборонене, а `test-upload` у `/public` — успішне.
Команда `ssh -T -i ~/.ssh/itasii_github_actions itasii-deploy@202.61.242.104 id`
не повинна виконувати `id` чи показувати uid: дозволений тільки SFTP.
Окремо перевірте нове root-підключення, перш ніж закривати старе.

## Nginx та Actions

В обох server-блоках чинного конфіга Nginx змініть root на
`/var/www/itasii/public`, зберігши налаштування сертифікатів:

```sh
nginx -t && systemctl reload nginx
```

GitHub secrets залишаються такими, як у README. SFTP workflow завантажує
тільки публічний архів у `/public`; shell і rsync на сервері не використовує.
Після деплою перевірте `http://202.61.242.104`.

Механізм ізоляції: [OpenSSH ChrootDirectory та ForceCommand](https://man.openbsd.org/sshd_config).
