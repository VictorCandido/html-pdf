const merge = require('easy-pdf-merge')
const fs = require('fs')
const pdf = require('html-pdf');
const pdfParser = require('pdf-parse');
const cors = require('cors')
const express = require('express');
const crypto = require('crypto')
const bodyParser = require('body-parser')

// const tmpl1 = fs.readFileSync(require.resolve('./test/template.html'), 'utf8')
// const tmpl2 = fs.readFileSync(require.resolve('./test/template3.html'), 'utf8')

const app = express();

app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))


app.post('/', (req, res) => {
    const time = new Date().getTime();
    const bites = crypto.randomBytes(4).toString('HEX');
    const name = time + bites;
    const { finalName = 'teste', templateResumo, templateOrcamentaria } = req.body;

    console.log('req.body', req.body)
    console.log(templateResumo)
    console.log(templateOrcamentaria)

    const configResumo = { 
        format: 'A4', 
        border: '10px' 
    }

    let configOrc = { 
        format: 'A4', 
        orientation: 'landscape', 
        border: '10px',
        header: {
            height: '15px',
            contents: ``,
        },
        footer: {
            height: "10px",
            contents: ''
        }
    }

    pdf.create(templateResumo, configResumo).toFile(__dirname + `/temp/${name}1.pdf`, async function (err, resResumo) {
        if (err) {
            return console.log(err)
        } 
        console.log('sucesso no primeiro', resResumo);

        const { filename: fileResumo } = resResumo

        const pdf1 = fs.readFileSync(require.resolve(fileResumo));
        const data = await pdfParser(pdf1);
    
        configOrc.footer.paginationOffset = data.numpages;
    
        pdf.create(templateOrcamentaria, configOrc).toFile(__dirname + `/temp/${name}2.pdf`, function (err, resOrc) {
            if (err) {
                return console.log(err)
            }       
            console.log('sucesso no segundo', resOrc);

            const { filename: fileOrc } = resOrc;
    
            const fileUrl = __dirname + `/temp/${name}final.pdf`;
    
            merge([fileResumo, fileOrc], fileUrl, err => {
                if (err) {
                    return console.log(err)
                }   
                console.log('Success Final')
                res.download(fileUrl, `${finalName}.pdf`);
                
                setTimeout(() => {
                    fs.unlink(fileResumo, () => console.log('ok'))
                    fs.unlink(fileOrc, () => console.log('ok'))
                    fs.unlink(fileUrl, () => console.log('ok'))
                }, 2000);
            })
    
        });
    });
})

// app.get('/', (req, res) => res.send('salve'))

app.listen(process.env.PORT || 3333, () => console.log('server online! Listening on port ' + process.env.PORT || 3333))
