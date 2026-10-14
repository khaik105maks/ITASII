# ITASII — розгортання на netcup

Статичний сайт. На хостингу не потрібні Node.js, Python, PHP або база даних.
Python 3.9+ використовується лише локально для створення архіву.

## Підготувати файли

У каталозі цього проєкту виконайте:

```sh
python3 tools/package_site.py
```

Результат: `dist/itasii-site.zip`. Архів містить шість HTML-сторінок,
`styles.css`, `script.js` та зображення з `assets/`. Пакувальник також
дозволяє поширені формати зображень і вебшрифтів для майбутніх ресурсів.
`.secrets`, `.git`, `tools` та серверна конфігурація в архів не потрапляють.
Публікуйте вміст архіву, а не весь репозиторій.

## netcup Webhosting (WCP/Plesk)

1. У панелі netcup перевірте **Document Root** потрібного домену.
   Використовуйте окремий каталог для цього сайту, наприклад `httpdocs/itasii`.
2. Розпакуйте архів локально та завантажте його вміст через файловий менеджер
   WCP або FTP-клієнт із шифруванням, використовуючи дані підключення з панелі.
   Файл `index.html` має лежати безпосередньо в Document Root, поряд із `assets/`.
3. Увімкніть сертифікат Let's Encrypt і перенаправлення HTTP → HTTPS у панелі.
4. Відкрийте домен і перевірте сторінки, фото та перемикання UA/EN.

Налаштування Document Root і SSL описані в
[офіційній документації netcup](https://www.netcup.com/en/helpcenter/documentation/web-hosting/interface).
Перед заміною наявного сайту збережіть його резервну копію.

## netcup VPS / Root Server

Нижче — приклад для Debian/Ubuntu з Nginx та доступом SSH/sudo.
Замініть `USER`, `SERVER_IP` і `example.com` своїми значеннями.
Для іншої ОС команди встановлення пакетів відрізнятимуться.

На локальному комп'ютері:

```sh
scp dist/itasii-site.zip USER@SERVER_IP:itasii-site.zip
scp deploy/nginx.conf USER@SERVER_IP:itasii-nginx.conf
ssh USER@SERVER_IP
```

На сервері, з домашнього каталогу користувача:

```sh
sudo apt update
sudo apt install nginx unzip certbot python3-certbot-nginx
sudo install -d -m 755 /var/www/itasii/public
sudo unzip -o itasii-site.zip -d /var/www/itasii/public
sudo find /var/www/itasii/public -type d -exec chmod 755 {} \;
sudo find /var/www/itasii/public -type f -exec chmod 644 {} \;
sudo install -m 644 itasii-nginx.conf /etc/nginx/sites-available/itasii
sudo nano /etc/nginx/sites-available/itasii
```

У редакторі замініть `example.com` у `server_name` на свій домен.
У другому блоці замініть `203.0.113.10` на публічну IPv4-адресу сервера.
Переконайтеся, що інший конфіг Nginx не обслуговує той самий домен.
Під час першого встановлення увімкніть сайт:

```sh
sudo ln -s /etc/nginx/sites-available/itasii /etc/nginx/sites-enabled/itasii
sudo nginx -t
```

Лише якщо перевірка успішна:

```sh
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

DNS-запис A домену має вказувати на IPv4 сервера. Додавайте AAAA тільки
за наявності налаштованого IPv6. У мережевому та системному firewall
дозвольте TCP 80 і 443, зберігаючи доступ SSH.
Коли домен відкривається через HTTP, увімкніть HTTPS:

```sh
sudo certbot --nginx -d example.com --redirect
sudo certbot renew --dry-run
```

Для оновлення повторно створіть архів, завантажте та розпакуйте його.
Повторно встановлювати конфіг Nginx після налаштування HTTPS не потрібно.
Перед оновленням збережіть копію `/var/www/itasii/public`; розпакування перезаписує
однойменні файли, але не видаляє старі.

## Доступ за IP

У `deploy/nginx.conf` є окремий HTTP-блок для IP. Замініть
`203.0.113.10` на адресу сервера: сайт відкриватиметься за `http://SERVER_IP/`.
Порт TCP 80 має бути доступний у firewall. DNS для цього не потрібен.
Nginx підтримує IP у `server_name`, як описано в
[документації](https://nginx.org/en/docs/http/server_names.html).

Якщо Nginx уже налаштований, додайте тільки другий `server`-блок із
`deploy/nginx.conf` до `/etc/nginx/sites-available/itasii`, зберігши наявні
налаштування HTTPS. Потім виконайте:

```sh
sudo nginx -t && sudo systemctl reload nginx
```

Домен може працювати через HTTPS, а IP — через HTTP. Наявний сертифікат
домену не забезпечує HTTPS за IP; для цього потрібен сертифікат саме на IP.
Запускайте наведену вище команду Certbot тільки для домену, щоб окремий
HTTP-блок IP залишався доступним. GitHub Actions оновлює файли сайту,
тому зміну конфігурації Nginx потрібно застосувати на сервері окремо.

## Автоматичний деплой через GitHub Actions (VPS)

Файл `.github/workflows/deploy.yml` запускає деплой після кожного push у
`main` або вручну через **Actions → Deploy ITASII to netcup → Run workflow**
для гілки `main`. Сайт завантажується через SFTP у `/var/www/itasii/public`.
Цей варіант потребує VPS з OpenSSH/SFTP; для Webhosting без такого доступу
потрібен інший workflow.

### 1. Один раз налаштуйте сервер

Налаштуйте ізоляцію за [інструкцією SFTP](deploy/SFTP.md).
Користувач `itasii-deploy` бачитиме `/var/www/itasii` як `/` і матиме
право запису тільки в `/public`. Nginx має використовувати
`root /var/www/itasii/public;` в обох блоках (домен та IP).
Ключ додається адміністратором до `/etc/ssh/authorized_keys/itasii-deploy`.

### 2. Створіть окремий SSH-ключ локально

```sh
ssh-keygen -t ed25519 -C github-itasii -f ~/.ssh/itasii_github_actions -N ''
cat ~/.ssh/itasii_github_actions.pub
```

Якщо файл ключа вже існує, використайте інше ім'я замість його перезаписування.
Вміст `.pub` додайте на сервер. Приватний файл без `.pub` збережіть у GitHub
secret `DEPLOY_SSH_KEY`, включно з рядками BEGIN/END. Ключі не додавайте в Git.

Отримайте host key сервера (для іншого SSH-порту замініть `22`):

```sh
ssh-keyscan -p 22 -t ed25519 SERVER_IP > /tmp/itasii_known_hosts
ssh-keygen -lf /tmp/itasii_known_hosts
```

Порівняйте fingerprint із результатом команди, виконаної через довірену
консоль сервера netcup:

```sh
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Якщо збігається, вміст `/tmp/itasii_known_hosts` використайте як
`DEPLOY_KNOWN_HOSTS`. Для `ssh-keyscan` і `DEPLOY_HOST` використовуйте однаковий
IP/hostname. Сам `ssh-keyscan` не перевіряє справжність сервера.

### 3. Додайте GitHub environment і secrets

У репозиторії відкрийте **Settings → Environments → New environment**,
створіть `production`. У **Environment secrets** додайте:

| Secret | Значення |
| --- | --- |
| `DEPLOY_HOST` | IPv4 або hostname сервера, без `https://` |
| `DEPLOY_USER` | `itasii-deploy` |
| `DEPLOY_SSH_KEY` | Повний приватний SSH-ключ |
| `DEPLOY_KNOWN_HOSTS` | Перевірений рядок host key з попереднього кроку |

Якщо SSH працює не на порту 22, додайте environment variable `DEPLOY_PORT`.
У deployment branch rules дозволяйте тільки `main`. Для автоматичного
запуску без ручного підтвердження не вмикайте required reviewers.
Докладніше: [керування деплоями GitHub Actions](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments).

### 4. Збережіть workflow у GitHub

Із кореня репозиторію ITASII:

```sh
git add .github/workflows/deploy.yml tools/deploy_site.sh tools/package_site.py README.md deploy/ .gitignore
git commit -m "Add netcup deployment with GitHub Actions"
git push origin main
```

Перегляньте результат у вкладці **Actions**. Runner має мати мережевий доступ
до SSH-порту сервера. Workflow перевіряє синтаксис JavaScript, створює архів
лише з публічних файлів і перевіряє наявність основних файлів після завантаження.
Nginx не перезапускається; нові статичні файли доступні одразу.
Після першого деплою перевірте сайт через браузер за пунктами нижче.

Файли передаються через SFTP послідовно; це не атомарна заміна сайту.
Перерваний деплой може залишити частково оновлені файли; повторіть запуск. Старі файли автоматично не видаляються. Для повернення попереднього
вмісту зробіть `git revert` потрібного коміту та push у `main`; зайві файли,
додані невдалим релізом, за потреби видаліть на сервері окремо.

## Перевірка після розгортання

- `/`, `/committee.html`, `/submission.html` відкриваються; стилі та фото завантажуються.
- Перемикання UA/EN і мобільне меню працюють.
- HTTPS має чинний сертифікат, HTTP перенаправляє на HTTPS.
- Неіснуючий URL повертає 404; `/.secrets/` і `/tools/` не видають файлів.

Посилання на Google Form ще не задане: `GOOGLE_FORM_URL` у `script.js`
дорівнює `"#"`. Щоб кнопка подачі відкривала форму, впишіть її справжню URL
і повторно створіть архів. До цього кнопка веде на сторінку подачі.
