const projects = require('../project-storage.js');


module.exports = {
    name: "updateProject",
    method:'POST',
    execute(body,req){
        let out_obj = {};
        return new Promise(async(resolve)=>{
            try{
            let project_id = body.ID;
            let updatedProject = body;
            let projectObject = await projects.getItem(project_id);
            if(projectObject!=null){
                if(projectObject.AuthorEmail === req.session.Email){
                    for (let key in updatedProject) {
                        if (updatedProject.hasOwnProperty(key)) {
                            projectObject[key] = updatedProject[key];
                        }
                    }
                    await projects.setItem(project_id,projectObject);
                    let projObj = await projects.getItem(project_id);
                    out_obj = {...projObj};
                    console.log("Project has been updated!")
                    out_obj["response"]="Project has been updated!"
                }else{
                    console.log("You are not the author of this project.")
                    out_obj["response"]="You are not the author of this project."
                }
            }else{
                console.log("Project does not exists.")
                out_obj["response"]="Project does not exists."
            }
            resolve(out_obj);
        }catch(err){
            out_obj["response"]="An error occured while updating the project."
            resolve(out_obj);      
        }
        });
    }
}