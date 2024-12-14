<h1 align="center">
  <br>
  <img src="https://cdn.wsquarepa.dev/content/1/PerpetuPlay-Logo.png?h=60bea762a70311dd2fae52d2cc1fc90d1dc6a864d2273447061d54009c5b99b7" alt="PerpetuPlay - Selfhosted 24/7 Discord Radio">
</h1>

## Introduction

PerpetuPlay is a Discord bot which streams your music to a Discord server. It uses multiple libraries, such as Discord.js and Lavalink (a comprehensive list is available below) to achieve a phenomenal listening experience for your server members.  
  
This project was started by wsquarepa becuase they noticed there were no suitable Discord bots that could reasonably play music from local files. It was also started partly because of Google's crackdown on bots accessing Youtube to stream music. As a result, wsquarepa set out to make their own bot, which plays from local files to circumvent this block. This project is exactly that.  
  
This project isn't intended for public use. Rather, each instance only supports one server. This is intended behaviour - streaming to multiple servers is expensive... and they'd only be able to listen to your library. That would be rather pointless, wouldn't it?  
  
Please note that you will have to supply your own music files. The method you obtain them is not of concern to this project. Please consider supporting the artists you stream.

## Features

- Play music 24/7 in a Discord channel
- Complete WebUI to manage the bot with
- Simple setup, powerful features
- Easy to manage, Discord-native permissions management

## Installation

Hardware requirements:

- Reccomended: **4GB** RAM, **10** (+ library size) **GB** Storage
- Minimum: **1.5GB** RAM, **3** (+ library size) **GB** Storage

Prerequisite software requirements:

- **Docker** (Tested on version 27.3.1, will likely work for Docker 27+)
- **Docker Compose**

1. Clone the repository

    ```sh
    git clone 
    cd PerpetuPlay
    ```

2. Ensure `docker.sh` is runnable

    ```sh
    chmod +x docker.sh
    ```

3. Copy environment file to edit

    ```sh
    cp .env.example .env
    ```

4. Edit the environment file with your favourite editing tool
5. Upload your music to `./lavalink/music/`. Most audio formats should work, though this is subject to support by [Lavalink](https://github.com/lavalink-devs/lavaplayer?tab=readme-ov-file#supported-formats).
6. Run the service

    ```sh
    ./docker.sh up
    ```
  
And voila! After completing the build of all the containers and deploying them, your bot will automatically join the voice channel you specified and start playing music!  
  
To manage your bot, you can visit `http://[ip]:[port]`. Further instructions can be found there. You can add SSL through the use of a reverse proxy like Nginx or Caddy.  
  
Logs can be viewed at any time using `./docker.sh logs`. Should you need to disable the bot, you can do so using `./docker.sh down`.  
  
To update the bot, follow these steps

1. Enter the directory containing the repository if you aren't already there.

    ```sh
    cd PerpetuPlay
    ```

2. Pull new changes

    ```sh
    git pull
    ```

3. Rebuild all containers

    ```sh
    ./docker.sh rebuild
    ```

Now the bot is updated to the latest version.

## Environment Variables

You will need to edit the `.env` file to properly run this bot.

`BOT_TOKEN`: Your Discord bot token.  
Create an application at Discord's [Developer Portal](https://discord.com/developers/applications). Then, head to the "Bot" tab, and regenerate the token. Copy the result, and paste it here.  
  
`CHANNEL_ID`: Voice channel ID where the bot will connect.  
You will need to enable "Developer Mode" under the Advanced Settings tab on your Discord client. Then, right click the voice channel you wish the bot to run in, and click "Copy Channel ID." Then paste that value here.  
  
`WEB_DASHBOARD_BASE_URL`: Web dashboard URL.  
This is not nessecary, but reccomended. This is the substitution for `{{URL}}` in `./bot/message.txt`. Set it to your dashboard URL, or change the message.  
  
`PORT`: Port for the web dashboard.  
Port to expose for the dashboard. If you want to restrict access to specific IPs, use a firewall. To add SSL, use a reverse proxy.  
  
`DISCORD_CLIENT_ID`: Discord client ID for OAuth.  
This value can be found on the Discord [Developer Portal](https://discord.com/developers/applications). Click the application for this bot, and select the "OAuth2" tab. Click the "Copy" button underneath "CLIENT ID". Then paste the value here.  
  
`DISCORD_CLIENT_SECRET`: Discord client secret for OAuth.  
This value is found on the same page as the Client ID. You will need to click "Reset Secret" and then copy it. Then paste the value here.  
  
`DISCORD_CALLBACK_URL`: The callback URL Discord will use.  
You need to set this in the "OAuth2" tab under "Redirects" in the Discord [Developer Portal](https://discord.com/developers/applications).  
  
Keep `/auth/cb` at the end for OAuth callbacks.  
  
Example: Callback URL "<https://my-music-bot.com/auth/cb>"  
Notice the use of `/auth/cb` at the end of the url. On the Discord Developer Portal, this exact string should also be present under the "Redirects" section.  
  
`DISCORD_GUILD_ID`: Your Discord server ID.  
This value is obtained in a similar fashion to the Channel ID parameter. Instead of right clicking a channel, however, you will right click your server, copy the ID, and paste it here.  
  
This value is used for user authentication, to make sure they are originating from this server. The bot must be a part of this server otherwise it will error.  
  
`SESSION_SECRET`: A random string for securing session cookies.  
Literally spam your keyboard and you'll be fine.  
  
## Acknowledgements

[Discord.JS](https://discord.js.org/) - Core bot package  
[Lavalink](https://lavalink.dev) - Music streaming library  
[Riffy](https://github.com/riffy-team/riffy) - Lavalink API wrapper  
[ExpressJS](https://expressjs.com/) - Web server package  
[React](https://reactjs.org/) - Frontend framework  
[Vite](https://vitejs.dev/) - Frontend bundler  
[Simple Design System](https://www.figma.com/community/file/1380235722331273046/simple-design-system) - Frontend icons
