const users = require('../user-storage.js');
module.exports = {
    name: "createUser",
    method:'POST',
    execute(body){
        let out_obj = {};
        return new Promise(async(resolve) => {
            let email = body.Email;
            let data = await users.getData();
            if(data[email]==null){
                body["ProjectsCreated"] = [];
                body["ProjectsInterested"] = [];
                await users.setItem(email,body);
                let userObject = await users.getItem(email);
                if(userObject!=null){
                    out_obj = userObject;
                    out_obj["response"]= "Created user!";
                }else{
                    out_obj["response"]= "Error creating user!";
                }
            }else{
                out_obj["response"]= "User already exists!";
            }    
            resolve(out_obj);   
     
        });
    }
}