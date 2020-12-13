const mongoose=require("mongoose")
// mongoose.connect('mongodb://localhost:27017/default', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect('mongodb+srv://asdfghjkl:asdfghjkl@nouman.ca2u5.mongodb.net/default?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

const signschema = new mongoose.Schema({
    name: String,
    email: String,
    password:String
  });

const clientschema = new mongoose.Schema({
  name: String,
  cast:String,
  cnic:String,
  phone_no:String,
  mobile_model:String,
  issue_date:String,
  mobile_price:String,
  monthly_emi:String,
  image:String
});

const clientemischema = new mongoose.Schema({
  month: String,
  amount:Number,
  rdate:String
});

module.exports.sign=signschema;
module.exports.client=clientschema;
module.exports.client_emi=clientemischema;