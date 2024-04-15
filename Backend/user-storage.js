const {LetsCollabStudentsAPI} = require('./mysql')
const yaml = require('yaml-config')
const config = yaml.readConfig("./config/config.yml",'default');
let filePath = config.debug ? "./studentprofilestest.json" : './studentprofiles.json';

const API = new LetsCollabStudentsAPI();
module.exports = {
  getData: async()=>{
    let allData = await API.getData();
    return allData;
  },
  getItem: async(key) => {
    let dataItem = await API.getItem(key);
    return dataItem;
  },
  addProjectInterest: async(email, projectID)=>{
    let res = await API.addProjectInterest(email, projectID);
    return res;
  },
  removeProjectInterest:async(email, projectID)=> {
    let res =await API.removeProjectInterest(email, projectID);
    return res;
  },
  getProjectsCreated:async(email)=>{
    let res = await API.getProjectsCreated(email);
    return res;
  },
  getInterestedProjects:async(email)=>{
    let res = await API.getInterestedProjects(email);
    return res;
  },
  setItem: async(key, value) => {
    await API.setItem(key, value);
  },
};