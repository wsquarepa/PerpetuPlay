<h1 align="center">
  <br>
  <img src="https://cdn.wsquarepa.dev/content/1/PerpetuPlay-Logo.png?h=60bea762a70311dd2fae52d2cc1fc90d1dc6a864d2273447061d54009c5b99b7" alt="PerpetuPlay - Selfhosted 24/7 Discord Radio">
</h1>

## Introduction

PerpetuPlay is a Discord bot that streams your music to a Discord server. It uses multiple libraries, such as Discord.js and Lavalink (a comprehensive list is available at the end of this document), to create a phenomenal listening experience for your server members.  
  
This project was started by wsquarepa because they noticed no suitable Discord bots could reasonably play music from local files. It was also started partly because of Google's crackdown on bots accessing YouTube to stream music. As a result, wsquarepa set out to make their own bot, which plays from local files to circumvent this block. This project is precisely that.  
  
Please note that you will have to supply your own music files. The method you use to obtain them is not of concern to this project. Please consider supporting the artists you stream.

This project isn't intended for public hosting (that is, it is not intended to be listed on a bot listing website). As per design ideology, each instance only supports one server. This number may increase slightly to allow your library to be played on multiple servers at once, but there has yet to be an update planned for that right now. The restriction is intended behavior - random servers can only listen to your music library. That would be rather pointless, wouldn't it?  

## Features

- Play music 24/7 in a Discord channel
- Complete WebUI to manage the bot with
- Simple setup, powerful features
- Easy to manage, Discord-native permissions management

## Installation

Hardware requirements:

- Recommended: **4GB** RAM, **10** (+ library size) **GB** Storage
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

3. Copy the environment file to edit

    ```sh
    cp .env.example .env
    ```

4. Edit the environment file with your favorite editing tool
5. Upload your music to `./lavalink/music/`. Most audio formats should work, though this is subject to support by [Lavalink](https://github.com/lavalink-devs/lavaplayer?tab=readme-ov-file#supported-formats).
6. Run the service

    ```sh
    ./docker.sh up
    ```
  
And voila! After you complete the build of all the containers and deploy them, your bot will automatically join the voice channel you specified and start playing music!  
  
To manage your bot, visit `http://[ip]:[port]` for further instructions. You can add SSL by using a reverse proxy like Nginx or Caddy.  
  
Logs can be viewed at any time using `./docker.sh logs`. Should you need to disable the bot, you can do so using `./docker.sh down`.  
  
To update the bot, follow these steps.

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

Now, the bot is updated to the latest version.

## Environment Variables

You must edit the `.env` file to run this bot properly.

`BOT_TOKEN`: Your Discord bot token.  
Create an application at Discord's [Developer Portal](https://discord.com/developers/applications). Then, head to the "Bot" tab and regenerate the token. Copy the result and paste it here.  
  
`CHANNEL_ID`: Voice channel ID where the bot will connect.  
You must enable "Developer Mode" under the Advanced Settings tab on your Discord client. Then, right-click the voice channel you wish the bot to run in, and click "Copy Channel ID." Then paste that value here.  
  
`WEB_DASHBOARD_BASE_URL`: Web dashboard URL.  
This is optional but recommended. This is the substitution for `{{URL}}` in `./bot/message.txt`. Please set it to your dashboard URL or change the message.  
  
`PORT`: Port for the web dashboard.  
The port to expose for the dashboard. Use a firewall to restrict access to specific IPs. Use a reverse proxy to add SSL.  
  
`DISCORD_CLIENT_ID`: Discord client ID for OAuth.  
This value can be found on the Discord [Developer Portal](https://discord.com/developers/applications). Click the application for this bot and select the "OAuth2" tab. Click the "Copy" button underneath "CLIENT ID". Then paste the value here.  
  
`DISCORD_CLIENT_SECRET`: Discord client secret for OAuth.  
This value is found on the same page as the Client ID. You will need to click "Reset Secret" and then copy it. Then paste the value here.  
  
`DISCORD_CALLBACK_URL`: The callback URL Discord will use.  
You need to set this in the "OAuth2" tab under "Redirects" in the Discord [Developer Portal](https://discord.com/developers/applications).  
  
Keep `/auth/cb` at the end for OAuth callbacks.  
  
Example: Callback URL "<https://my-music-bot.com/auth/cb>"  
Notice the use of `/auth/cb` at the end of the URL. This exact string should also be present under the "Redirects" section on the Discord Developer Portal.  
  
`DISCORD_GUILD_ID`: Your Discord server ID.  
This value is obtained similarly to the Channel ID parameter. Instead of right-clicking a channel, you right-click your server, copy the ID, and paste it here.  
  
This value is used for user authentication to ensure they originate from this server. The bot must be a part of this server; otherwise, it will error.  
  
`SESSION_SECRET`: A random string for securing session cookies.  
Spam your keyboard, and you'll be fine. This is the secret that will be used to secure sessions.
  
## Acknowledgements

[Discord.JS](https://discord.js.org/) - Core bot package  
[Lavalink](https://lavalink.dev) - Music streaming library  
[Riffy](https://github.com/riffy-team/riffy) - Lavalink API wrapper  
[ExpressJS](https://expressjs.com/) - Web server package  
[React](https://reactjs.org/) - Frontend framework  
[Vite](https://vitejs.dev/) - Frontend bundler  
[Simple Design System](https://www.figma.com/community/file/1380235722331273046/simple-design-system) - Frontend icons
