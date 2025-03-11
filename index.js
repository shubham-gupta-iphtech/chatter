import express from "express"
import mongoose from "mongoose"
import dbconnect from "./database/dbconnect.js";
import router from "./routes/routes.js";
import cookieParser from "cookie-parser";


const app = express();

app.use(express.json());
app.use(cookieParser());

dbconnect().then(()=> 
{
    console.log("successfully executed db connection");
})
.catch((err)=> {
    console.log("some error occured.",err);
})



//middleware
app.use("/api",router);




app.listen(process.env.PORT,()=> {
console.log("Server is listening");
});


