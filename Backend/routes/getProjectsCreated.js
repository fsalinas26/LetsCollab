const users = require('../user-storage.js');
module.exports = {
    name: "getProjectsCreated",
    method:'GET',
    execute(params,req){
        let out_obj = {};
        return new Promise(async(resolve) => {
            let id = req.session.Email || params.id;
            let projectsCreated = await users.getProjectsCreated(id);
            if(projectsCreated != null){
                out_obj["ProjectsCreated"] = projectsCreated;
                out_obj["response"] = "Got Projects Created";
            }else{
                out_obj["response"] = "User does not exists";
            }
            resolve(out_obj);            
        });
    }
}