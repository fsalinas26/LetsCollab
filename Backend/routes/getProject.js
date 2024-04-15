const projects = require('../project-storage.js');
module.exports = {
    name: "getProject",
    method:'GET',
    execute(params){
        let out_obj = {};
        return new Promise(async (resolve)=>{
            let projectObject = await projects.getItem(params.id);    
            if(projectObject == null){
                out_obj["response"] = "Project does not exist";
            }else{
                out_obj = {...projectObject};
                out_obj["response"] = "Successfully fetched project";    
            }
            resolve(out_obj);            
        });
    }
}