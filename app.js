const exec = require('child_process').exec;
const express = require('express');
const pug = require('pug');
const moment = require('moment');
const ansi_up = require('ansi_up');

let app = express();

app.use('/assets', express.static('assets'));
app.get('/logs/:container', (req, res) => {
    new Promise((resolve, reject) => exec('docker logs ' + req.param('container') + ' --tail 2560', (error, stdout, stderr) => { //2560
        if (error) {
            reject(error);
        } else if (stdout && stdout.trim() !== '') {
            resolve(stdout);
        } else {
            reject(stderr);
        }
    }))
        .then(logs => logs.split(' ').join('&nbsp;'))
        .then(logs => ansi_up.ansi_to_html(logs))
        .then(logs => pug.renderFile('./logs.pug', {pretty: true, logs}))
        .then(d => res.status(200).set('Content-type', 'text/html').send(d))
        .catch(e => res.status(500).set('Content-type', 'text/plain').send(e.stack ? e.stack : e));
});

app.get('/*', (req, res) => {
    new Promise((resolve, reject) => exec('docker inspect $(docker ps --all -q)', (error, stdout, stderr) => {
        if (error) {
            reject(error);
        } else if (stdout && stdout.trim() !== '') {
            resolve(stdout);
        } else {
            reject(stderr);
        }
    }))
        .then(data => JSON.parse(data))
        .then(containers => pug.renderFile('./index.pug', {pretty: true, containers, moment}))
        .then(d => res.status(200).set('Content-type', 'text/html').send(d))
        .catch(e => res.status(500).set('Content-type', 'text/plain').send(e.stack ? e.stack : e));
});

app.listen(process.env.PORT || 8080, _ => console.log('Server started.'));