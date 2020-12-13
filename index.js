const express=require("express");
const mongoose=require("mongoose");
const path=require("path");
const bodyParser=require("body-parser");
const multer = require("multer");
var fs = require('fs');
const schema=require("./modules/schema");
const app=express();

// Schemas of DB's
signschema=schema.sign;
clientschema=schema.client;
clientemischema=schema.client_emi;

// Connection with different Db
const myDBsign = mongoose.connection.useDb('sign');
const myDBclient_emi = mongoose.connection.useDb('client_emi');

// Body Parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static Folder
app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

var f;  // for register new client
var u;  // for update variable
var dl; // for delete variable
var nic; // for store cnic value for client details
var formvar="";
var messagenew="";
var message="";
var messageclient="";
var messagelogin="";

app.get("/",function(req,res){
    res.sendFile(__dirname+"/views/index.html")
});

app.get("/admin",function(req,res){
    res.render("login",{msglogin:messagelogin})
});

app.get("/register_new_admin",function(req,res){
    res.render("registeration",{msgadmin:message})
});

app.get("/register_new_client",function(req,res){
    f=0;
    res.render("add_new_client",{msgclient:messageclient})
});

app.get("/update_client_detail",function(req,res){
    u=0;
    client_detail_update=myDBsign.model("client",clientschema);
    var filter_data=client_detail_update.findOne({cnic:nic})
    filter_data.exec(function(err,data){
        if (err) throw error;
        var d=data.issue_date.split("-");
        var dd=d[2]+"-"+d[1]+"-"+d[0];
        res.render("update_client_details",{record:data,date:dd})
    })
});

// for file upload
var Storage=multer.diskStorage({
    destination:"./public/clients_images/",
    filename:(req,file,cb)=>{
        cb(null,req.body.cnic+path.extname(file.originalname))
    }
})
var upload=multer({
    storage:Storage
}).single('file');


// middleware for clints to check signin ,add new client ,add new admin details
var validation=function(req,res,next){
    if(dl==0){
        del_form=req.body.form;
        dl++;
    }
    else{
        del_form=""
    }
    signmodel=myDBsign.model("admin",signschema);
    if(req.body.form=="login"){
        var para={$and:[{email:req.body.email.trim()},{password:req.body.password.trim()}]}
        var filter=signmodel.find(para)
        filter.exec(function(err,data){
            if (err) throw error;
            if (data=="" || data==null || data==undefined){
                messagelogin="Your email/password is incorrect!";
                res.redirect('/admin');
            }
            else{
                messagenew="";
                messagelogin="";
                next()
            }
        })
    }
    // register new client
    else if(req.body.form=="Register"){ 
        var filter_email=signmodel.find({email:req.body.email.trim()})
        filter_email.exec(function(err,data){
            if (err) throw error;
            if (data=="" || data==null || data==undefined){
                var reg=new signmodel({
                    name:req.body.name,
                    email:req.body.email.trim(),
                    password:req.body.password
                }) 
                reg.save();
                messagenew="Succesfully Add New Admin"
                message="";
                next()
            }
            else{
                message="This email is already exit!";
                res.redirect('/register_new_admin');
            }
        })
    }
    else if(del_form=="delete"){
        var clientsignmodel=myDBsign.model("client",clientschema);
    
        var id=req.body.value
        var v=id.split(".")

        client_emi_model=myDBclient_emi.model(v[0],clientemischema);
        var filter_emi=client_emi_model.find({});

        var filePath =__dirname+'/public/clients_images/'+v[0]+"."+v[1];
        var del=clientsignmodel.findOneAndDelete(v[0]);
        del.exec(function(err){
            if (err) throw error;
            fs.unlinkSync(filePath);
            filter_emi.exec(function(err,data){
                if (err) throw error;
                if (data=="" || data==null || data==undefined){
                    next()
                } 
                else{
                    myDBclient_emi.dropCollection(v[0], function (err, result) {
                    if (err) throw error;
                    next()
                    })
                }
            })
        })
    }
    else if(req.body.form=="edit"){
        up="update"
        var v=req.body.value
        var c=v.split(".")
        nic=c[0]
        res.redirect("/update_client_detail")
    }
    else{
        messagenew="";
        next();
    }
}
var c=0;

app.post("/clients",validation,upload,function(req,res){
    c++;
    // ye is lie hai agr client page ko refresh krte the add new client k bad to her refresh pr client add hota ja rha tha
    if(f==0){
        formvar=req.body.form;
        f++;
    }
    else{
        formvar="";
    }
    
    // client model in sign data base
    client_model=myDBsign.model("client",clientschema);

    // is ko middleware main is lie nhi rkha q k multer lga hai aur multer ko use krte hwe hum image upload krwa rhe hain
    if(formvar=="add_new_client"){
        var filter_cnic=client_model.findOne({cnic:req.body.cnic})
        filter_cnic.exec(function(err,data){
            if (err) throw error;
            console.log(data)
            if (data=="" || data==null || data==undefined){
                var date=req.body.issue_date.split("-");
                var creg=new client_model({
                    name: req.body.name,
                    cast:req.body.cast,
                    cnic:req.body.cnic,
                    phone_no:req.body.phone_no,
                    mobile_model:req.body.mobile_model,
                    issue_date:date[2] + "-" + date[1] + "-" + date[0],
                    mobile_price:req.body.mobile_price,
                    monthly_emi:req.body.monthly_emi,
                    image:req.file.filename
                });
                creg.save(function(){
                    messagenew="Succesfully Add New Client";
                    messageclient="";
                    var filter_clients=client_model.find({});
                    filter_clients.exec(function(err,data){
                        if (err) throw error;
                        res.render("clients",{read:data,msg:messagenew});
                    });
                });
            }
            else{
                messageclient="This CNIC No is already exit!";
                res.redirect('/register_new_client');
            }
        });
    }

    else{
        message="";
        messageclient="";
        messagelogin="";
        var filter=client_model.find({});
        filter.exec(function(err,data){
            if (err) throw error;
            res.render("clients",{read:data,msg:messagenew})
        })
    }
});

var add,deemi;
// middleware for clints details to add emi's wrna wo cnic ki value na aane pr error de rha tha
var validation2=function(req,res,next){
    if (c>=0){
        nic=req.body.cnic;
        next();
    }
    else if(deemi!==req.body.demi && req.body.demi!==undefined){
        deemi=req.body.demi;
        var client_emi_model=myDBclient_emi.model(nic,clientemischema);
        var id = req.body.demi;
        var del=client_emi_model.findOneAndDelete(id);
        del.exec(function(err){
            if (err) throw error;
            next();
        });
    }
    else{
    next();
    }
}

app.post("/clientdetails",validation2,function(req,res){
    dl=0;
    messagenew="";
    if(u==0){
        formuvar=req.body.form;
        f++;
    }
    else{
        formuvar="";
    }
    client_detail_model=myDBsign.model("client",clientschema);
    client_emi_model=myDBclient_emi.model(nic,clientemischema);

    var month=["January", "February","March","April","May","June","July","August","September","October","November","December"];
    var filter_details=client_detail_model.findOne({cnic:nic});
    var filter_emi=client_emi_model.find({});
    
    // Add emi
    if (add!==req.body.button && req.body.button!==undefined){
        add=req.body.button;
        var date=req.body.rdate.split("-");
        var mm=date[1]-1;
        var emi=new client_emi_model({
            month:month[mm],
            amount:req.body.amount,
            rdate:date[2] + "-" + date[1] + "-" + date[0]
        })
        emi.save(function(err,res1){
            filter_details.exec(function(err,data1){
                if (err) throw error;
                filter_emi.exec(function(err,data){
                    if (err) throw error;
                    res.render("client_details",{read1:data1,read:data})
                });
            });
        });
    }

    else{
        c=-1;
        if(formuvar=="update_client_details"){
            var date=req.body.issue_date.split("-");
            var filter_details_update=client_detail_model.findOneAndUpdate(req.body.id,{
                name: req.body.name,
                cast:req.body.cast,
                cnic:req.body.cnic,
                phone_no:req.body.phone_no,
                mobile_model:req.body.mobile_model,
                issue_date:date[2] + "-" + date[1] + "-" + date[0],
                mobile_price:req.body.mobile_price,
                monthly_emi:req.body.monthly_emi
            });
            filter_details_update.exec();
        }
        filter_details.exec(function(err,data1){
            if (err) throw error;
            if (data1=="" || data1 == null || data1 == undefined){
                res.redirect(307,"/clients")
            }
            else{
            filter_emi.exec(function(err,data){
                if (err) throw error;
                res.render("client_details",{read1:data1,read:data})
            })
            }
        })
    }
    

});

app.listen(process.env.PORT || 5000,()=>console.log("App is RUnning"))