#!/usr/bin/env bash
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install mysql-server
cd ~/
npm i http https fs path request mysql querystring express body-parser express-fileupload bcrypt async cookie-parser gm