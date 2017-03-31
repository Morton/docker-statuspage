const exec = require('child_process').exec;
const express = require('express');
const pug = require('pug');

let app = express();

app.use('/assets', express.static('assets'));
app.get('/*', (req, res) => {
    new Promise((resolve, reject) => exec('docker ps --all -s --no-trunc', (error, stdout, stderr) => {
        console.log('error:\n', error, '\nstdout:\n', stdout, '\nstderr:\n', stderr);
        if (error) {
            reject(error);
        } else if (stdout && stdout.trim() !== '') {
            resolve(stdout);
        } else {
            reject(stderr);
        }
    }))
        .then(d => d.split('\n').filter(s => s.trim() !== ''))
        .then(d => {
            let lengths = [];
            let result;
            while (null !== (result = /([a-zA-Z]+ ?[a-zA-Z]+ *)/.exec(d[0].substr(lengths.reduce((p, v) => p + v, 0))))) {
                lengths.push(result[0].length);
            }

            let headers = [];
            for (let i = 0; i < lengths.length; i++) {
                headers.push(d[0].substr(lengths.slice(0, i).reduce((p, v) => p + v, 0), lengths[i]).trim().toLowerCase());
            }

            let table = [headers];
            for (let j = 1; j < d.length; j++) {
                let object = [];
                for (let i = 0; i < lengths.length; i++) {
                    object.push(d[j].substr(lengths.slice(0, i).reduce((p, v) => p + v, 0), (i !== lengths.length - 1 ? lengths[i] : undefined)).trim().toLowerCase());
                }
                table.push(object);
            }

            return table;
        })
        .then(table => pug.renderFile('./index.pug', {pretty: true, table}))
        .then(d => res.status(200).send(d))
        .catch(e => res.status(500).send(e));
});

app.listen(process.env.PORT || 8080, _ => console.log('Server started.'));