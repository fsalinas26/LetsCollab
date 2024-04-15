const projects = require('../project-storage.js');
module.exports = {
    name: "getInterestedUsers", //gets interested users by project
    method:'GET',
    execute(params){
        let out_obj = {};
        return new Promise(async(resolve) => {
            let projectID = params.id;
            let interestedUsers = await projects.getInterestedUsers(projectID);    
            if(interestedUsers == null){
                out_obj["response"] = "Project does not exist";
            }else{
                out_obj["InterestedUsers"] = interestedUsers;
                out_obj["response"] = "Successfully fetched interested users";    
            }
            resolve(out_obj);            
        });
    }
}