const users = require('../user-storage.js');
module.exports = {
    name: "getUser",
    method:'GET',
    execute(params){
        let out_obj = {};
        return new Promise(async(resolve) => {
            let userObject = await users.getItem(params.id);
            if(userObject != null){
                out_obj = userObject;
                out_obj["response"] = "Got User";
            }else{
                out_obj["response"] = "User does not exists";
            }
            resolve(out_obj);            
        });
    }
}