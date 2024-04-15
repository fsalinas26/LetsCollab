const users = require('../user-storage.js');
module.exports = {
    name: "getMyInfo",
    method:'GET',
    execute(params,req){
        let out_obj = {};
        return new Promise(async(resolve)=>{
            let userid = req.session.Email;
            if(userid==null){
                out_obj["response"] = "User has no session token!";
                resolve(out_obj);
            }
            let userObject = await users.getItem(userid);
            if(userObject != null){
                const { ["Password"]: _, ...new_obj } = userObject;
                out_obj = new_obj;
                out_obj["response"] = "User info sent";
            }else{
                out_obj["response"] = `Error fetching user with email ${req.session.Email}`;
            }
            resolve(out_obj);            
        });
    }
}