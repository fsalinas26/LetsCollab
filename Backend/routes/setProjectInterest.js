const users = require('../user-storage.js');

module.exports = {
    name: "setProjectInterest",
    method:'POST',
    execute(body,req){
        let out_obj = {};
        return new Promise(async(resolve) => {
            let projectID = body.id;
            let interested = body.setInterestTo; //boolean value passed from client, TRUE = add project interest, FALSE = remove it
            let email = req.session.Email;
            let res = await new Promise(async(resolve)=>{
                if(interested){
                    resolve(await users.addProjectInterest(email, projectID));
                }else{
                    resolve(await users.removeProjectInterest(email, projectID));
                }
            })
            if(res){
                out_obj["result"]="success";
                out_obj["response"] = "Interest set successfully";
            }else{
                out_obj["response"] = "Error setting interest";
            }
            resolve(out_obj);            
        });
    }
}