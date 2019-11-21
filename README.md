# Multi Theft Auto Discord Wiki Bot
This is a NodeJS/Discord.js Wiki Bot for Multi Theft Auto Discord Community.  
It's been a long while since I've wrote this. Sorry if it's a bit messy.
# Requirements:
1) NodeJS:
https://nodejs.org/en/download/
2) pm2 (optional)

# Installation:
1) Clone the repo
```sh
git clone https://github.com/Deihim007/MTA-Wiki-Bot.git
```
2) Install dependencies
```sh
cd MTA-Wiki-Bot
npm install
```
3) Install pm2 (optional)
```sh
npm install -g pm2
```
4) Set the bot token (https://discordapp.com/developers/) at the end of `index.js` file.
5) Run the bot using `node index.js` or `pm2` if you've installed it in step 3 `pm2 start index.js`.
