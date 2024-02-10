const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = (express());
require('dotenv').config();

// middle ware

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ycofkd3.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});




async function run() {
    try {

        // collection
        const accountTypesCollection = client.db('hello-bank-user').collection('accountTypes');
        const accountsCollection = client.db('hello-bank-user').collection('accounts');

        const cardTypesCollection = client.db('hello-bank-user').collection('cardTypes');
        const cardsCollection = client.db('hello-bank-user').collection('cards');

        const loanTypesCollection = client.db('hello-bank-user').collection('loanTypes');
        const loansCollection = client.db('hello-bank-user').collection('loans');

        const usersCollection = client.db('hello-bank-user').collection('users');

//requestedUsers : openAccountFrom:post
const usersAccountCollection = client.db('hello-bank-user').collection('userAccounts');

const userDepositTransferCollection = client.db('hello-bank-user').collection('depositRequest');
//requestedUsers : opencardFrom:post
const usersCardsCollection = client.db("BravoBank").collection("userCards");
//requestedUsers : openloanFrom:post
const userLoansCollection = client.db("BravoBank").collection("userLoans");

        //1 accounts api

        app.get('/accountType', async (req, res) => {
            const query = {};
            const result = await accountTypesCollection.find(query).toArray();
            res.send(result)
        })

        app.get("/accounts/:accountType", async (req, res) => {
            const accountType = req.params.accountType;
            const query = { accountType: accountType };
            const result = await accountsCollection.findOne(query);
            res.send(result);
        });


        //2 cards api

        app.get('/cardTypes', async (req, res) => {
            const query = {};
            const result = await cardTypesCollection.find(query).toArray();
            res.send(result)
            // console.log(result);
        })

        app.get("/cards/:cardType", async (req, res) => {
            const cardType = req.params.cardType;
            const query = { cardType: cardType };
            const result = await cardsCollection.findOne(query);
            res.send(result);
        });


        //3 loans api

        app.get('/loanTypes', async (req, res) => {
            const query = {};
            const result = await loanTypesCollection.find(query).toArray();
            res.send(result)
        })

        app.get("/loans/:loanType", async (req, res) => {
            const loanType = req.params.loanType;
            const query = { loanType: loanType };
            const result = await loansCollection.findOne(query);
            res.send(result);
        });

 // 4. register

      //register add Users: post 
      app.post("/users", async (req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        console.log(result);
        res.send(result);
      });

   //register add Users: post er data get(dashboard)
    app.get("/allUsers", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    //register add Users: delete 
    app.delete("/allUsers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });


  // Data storing for the requested accounts
  app.post("/requestedUsers", async (req, res) => {
    const reqUsers = req.body;
    console.log(reqUsers);
    const result = await usersAccountCollection.insertOne(reqUsers);
    res.send(result);
  });
  

  // user profile account
  app.get("/userAccount", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const result = await usersAccountCollection.find(query).toArray();
    res.send(result);
  });

// Dashboard userRequest
app.get("/userAccounts", async (req, res) => {
  // const email = req.query.email;
  const query = {};
  const result = await usersAccountCollection.find(query).toArray();
  res.send(result);
});

app.get("/singleAccDetails/:id", async (req, res) => {
  const id = req.params.id;
  // console.log(id)
  const query = { _id: new ObjectId(id) }
  const result = await usersAccountCollection.findOne(query);
  res.send(result);
  // console.log(result)
});

  
 //   // deposit amount 
 app.put('/depositRequest', async (req, res) => {
  const deposit = req.body;
  const result = await userDepositTransferCollection.insertOne(deposit)

  const filters = { _id: new ObjectId(deposit.accountNumber) }
  const options = { upsert: true };
  const updateDocs = {
    $set: {
      depositReq: 'pending'
    }
  }
  const result2 = await usersAccountCollection.updateOne(filters, updateDocs, options);

  res.send(result)
})  

// dashboard deposit update

app.get('/dashDepoShow', async(req, res) =>{
  const query = {};
  const result = await userDepositTransferCollection.find(query).toArray();
  res.send(result);
})

app.put('/userDepositUpdate', async (req, res) => {

  const id = req.body.id;
  const filter = { _id: new ObjectId(id) }
  const option = { upsert: true };
  const updateDoc = {
    $set: {
      depStatus: 'success'
    }
  }
  const result = await userDepositTransferCollection.updateOne(filter, updateDoc, option);

  const accountNumber = req.body.accountNumber;
  const filters = { _id: new ObjectId(accountNumber) }
  const result3 = await usersAccountCollection.findOne(filters);
  const newDepositAmount = Number(req.body.depositAmount)
  const options = { upsert: true };
  const updateDocs = {
    $set: {
      depositReq: 'success',
      amount: Number(result3.amount + newDepositAmount)
    }
  }
  const result2 = await usersAccountCollection.updateOne(filters, updateDocs, options);
  res.send(result);
})



app.delete('/userDepositDelete/:id', async (req, res) => {
  const query = req.body;
  const id = query.id;
  // console.log(id)
  const match = { _id: new ObjectId(id) }
  const result = await userDepositTransferCollection.deleteOne(match)

  const accountNumber = req.body.accountNumber;
  const filters = { _id: new ObjectId(accountNumber) }
  const result3 = await usersAccountCollection.findOne(filters);
  const options = { upsert: true };
  const updateDocs = {
    $set: {
      depositReq: 'declined'
    }
  }
  const result2 = await usersAccountCollection.updateOne(filters, updateDocs, options);

  res.send(result);
})
   
  //  accountInfo

  app.put('/userStatusUpdate/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }
    const option = { upsert: true };
    const updateDoc = {
      $set: {
        status: 'success'
      }
    }
    const result = await usersAccountCollection.updateOne(filter, updateDoc, option);
    res.send(result)
  })

app.delete("/requestedUsersDelete/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await usersAccountCollection.deleteOne(query);
  res.send(result);
});

 
//Card Request
app.post('/cardsReq', async (req, res) => {
  const query = req.body;
  const result = await usersCardsCollection.insertOne(query);

  const id = req.body.accountNumber;
  const filter = { _id: new ObjectId(id) }
  const option = { upsert: true };
  const updateDoc = {
    $set: {
      cards: 'pending'
    }
  }
  const result2 = await usersAccountCollection.updateOne(filter, updateDoc, option);
  res.send(result);
})

// dashboard card request
app.get('/dashCardReq', async (req, res) => {
  const query = {}
  const result = await usersCardsCollection.find(query).toArray();
  res.send(result);
})

// dashboard card Delete
app.delete('/dashCardDelete', async (req, res) => {
  const query = req.body;

  const accountNumber = query.accountNumber;
  const filter = { _id: new ObjectId(accountNumber) }
  const option = { upsert: true };
  const updateDoc = {
    $set: {
      cards: ''
    }
  }
  const result2 = await usersAccountCollection.updateOne(filter, updateDoc, option);

  const id = query.id;
  const match = { _id: new ObjectId(id) }
  const result = await usersCardsCollection.deleteOne(match)
  res.send(result);
})


// dashboard debit card Update
app.put('/dashCardDebit', async (req, res) => {
  const query = req.body;

  const accountNumber = query.accountNumber;
  const filter = { _id: new ObjectId(accountNumber) }
  const option = { upsert: true };
  const updateDoc = {
    $set: {
      cards: 'https://i.ibb.co/bWntm6V/debit-card-hello.png',
      cardStatus: 'success'
    }
  }
  const result2 = await usersAccountCollection.updateOne(filter, updateDoc, option);

  const id = query.id;
  const match = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updateDocs = {
    $set: {
      status: 'success'
    }
  }
  const result = await usersCardsCollection.updateOne(match, updateDocs, options);

  res.send(result);
})

// dashboard credit card Update
app.put('/dashCardCredit', async (req, res) => {
  const query = req.body;

  const accountNumber = query.accountNumber;
  const filter = { _id: new ObjectId(accountNumber) }
  const option = { upsert: true };
  const updateDoc = {
    $set: {
      cards: 'https://i.ibb.co/rQ8S8LY/debit-card-hello.png',
      cardStatus: 'success'
    }
  }
  const result2 = await usersAccountCollection.updateOne(filter, updateDoc, option);

  const id = query.id;
  const match = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updateDocs = {
    $set: {
      status: 'success'
    }
  }
  const result = await usersCardsCollection.updateOne(match, updateDocs, options);

  res.send(result);
})

 // User Loan
 app.post('/loanReq', async (req, res) => {
  const loanData = req.body;
  const result = await userLoansCollection.insertOne(loanData);

  const id = req.body.accountNumber;
  const filter = { _id: new ObjectId(id) }
  const option = { upsert: true };
  const updateDoc = {
    $set: {
      loanStatus: 'pending'
    }
  }
  const result2 = await usersAccountCollection.updateOne(filter, updateDoc, option);

  res.send(result);
})

// dashboard Loan reqest
app.get('/userLoanReq', async (req, res) => {
  const query = {};
  const result = await userLoansCollection.find(query).toArray();
  res.send(result);
})

app.get("/singleLoanDetails/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await userLoansCollection.findOne(query);
  res.send(result);
});

// dashboard loan update
app.put('/userLoanUpdate', async (req, res) => {

  const id = req.body.id;
  const filter = { _id: new ObjectId(id) }
  const option = { upsert: true };
  const updateDoc = {
    $set: {
      status: 'success'
    }
  }
  const result = await userLoansCollection.updateOne(filter, updateDoc, option);

  const accountNumber = req.body.accountNumber;
  const filters = { _id: new ObjectId(accountNumber) }
  const options = { upsert: true };
  const updateDocs = {
    $set: {
      loanStatus: 'success'
    }
  }
  const result2 = await usersAccountCollection.updateOne(filters, updateDocs, options);

  res.send(result);
})

app.delete("/userLoanDelete/:id", async (req, res) => {

  const accountNumber = req.body.accountNumber;
  const filters = { _id: new ObjectId(accountNumber) }
  const options = { upsert: true };
  const updateDocs = {
    $set: {
      loanStatus: ''
    }
  }
  const result2 = await usersAccountCollection.updateOne(filters, updateDocs, options);

  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await userLoansCollection.deleteOne(query);
  res.send(result);
});

// User Loan Show in there profile
app.get('/userLoans', async (req, res) => {
  const email = req.query.email;
  const query = { email: email }
  console.log(email);
  const result = await userLoansCollection.find(query).toArray();
  res.send(result);
})















    } finally {

    }
}
run().catch(console.log);




app.get('/', (req, res) => {
    res.send("hello bank server ")
})

app.listen(port, () => console.log(`hello bank server is running ${port}`))

