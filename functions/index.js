/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const express = require('express');
const cors = require('cors');

//main app
const app = express();
app.use(cors( {origin: true} ));
// main db reference
const db = admin.firestore();

// routes
app.get('/',(req,res) => {
    return res.status(200).send('hi there how you doning?')
});


// Create -> post()
app.post("/api/create", verifyIdToken , (req,res)=> {
    (async () => {
        try{
            await db.collection('userDetails').doc(`/${Date.now()}/`).create({
                id : Date.now(),
                name : req.body.name,
                mobile : req.body.mobile,
                address : req.body.address
            });

            return res.status(200).send({status : "success", msg : "data saved"});
        }catch(error){
            console.log(error)
            return res.status(500).send({status : "failed", msg : error});
        }
    })();
});

// Get -> get();
//fetch single data from firestore using specific Id
app.get('/api/get/:id' , (req , res) => {
    (async () => {
        try{
            const reqDoc = db.collection('userDetails').doc(req.params.id);
            let userDetail = await reqDoc.get();
            let response = userDetail.data();
            if(!response){
                return res.status(404).send({status : "not found", msg : "not found" , data : response})
            } 

            return res.status(200).send({status : "success", data : response});
        }catch(error){
            console.log(error)
            return res.status(500).send({status : "failed", msg : error});
        }
    })();
})
//fetch all data from firestore 
app.get('/api/getAll' , (req , res) => {
    (async () => {
        try{
            let response = [];
            const query = db.collection('userDetails');
            await query.get().then((data) => {
                let docs = data.docs;
                docs.map((doc) => {
                    const selectedItem = {
                        id : doc.data().id,
                        name : doc.data().name,
                        mobile : doc.data().mobile,
                        address : doc.data().address
                    };
                    response.push(selectedItem);
                });
                return response;
            });
            return res.status(200).send({status : "success", data : response});
        }catch(error){
            console.log(error)
            return res.status(500).send({status : "failed", msg : error});
        }
    })();
})
// Update => put()
app.put("/api/update/:id", verifyIdToken , (req,res)=> {
    (async () => {
        try{
            const reqDoc = db.collection('userDetails').doc(req.params.id);
            await reqDoc.update({
                name : req.body.name,
                mobile : req.body.mobile,
                address : req.body.address
            });
            return res.status(200).send({status : "success", msg : "data updated"});
        }catch(error){
            console.log(error)
            return res.status(500).send({status : "failed", msg : error});
        };
    })();
});
// Delete => delete()
app.delete("/api/delete/:id", verifyIdToken , (req,res)=> {
    (async () => {
        try{
            const reqDoc = db.collection('userDetails').doc(req.params.id);
            await reqDoc.delete();
           
            return res.status(200).send({status : "success", msg : "data removed"});
        }catch(error){
            console.log(error)
            return res.status(500).send({status : "failed", msg : error});
        };
    })();
});
// for auth
async function verifyIdToken(req, res, next) {
    const idToken = req.headers.authorization && req.headers.authorization.split(' ')[1];
  
    if (!idToken) {
      return res.status(401).send('Unauthorized: No token provided');
    }
  
    try {
      // verigy ID Token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken;  // success
      next();  // 進入 API router
    } catch (error) {
      return res.status(401).send('Unauthorized: Invalid token');
    }
  }

//exports the api to firebase cloud functions
exports.app = onRequest(app);
