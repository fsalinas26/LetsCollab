const users = require('../user-storage.js');
module.exports = {
    name: "getInterestedProjects",
    method:'GET',
    execute(params,req){
        let out_obj = {};
        return new Promise(async(resolve) => {
            let id = req.session.Email || params.id;
            let interestedProjects = await users.getInterestedProjects(id);
            if(interestedProjects != null){
                out_obj["ProjectsInterested"] = interestedProjects;
                out_obj["response"] = "Got Interested Projects";
            }else{
                out_obj["response"] = "User does not exists";
            }
            resolve(out_obj);            
        });
    }
}