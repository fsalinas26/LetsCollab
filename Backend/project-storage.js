const {LetsCollabProjectsAPI} = require('./mysql')
const yaml = require('yaml-config')
const config = yaml.readConfig("./config/config.yml",'default');
let filePath = config.debug ? "./projectstest.json" : './projects.json';
console.log(`Using ${filePath} for student profiles because debug is ${config.debug}`);

const API = new LetsCollabProjectsAPI();
module.exports = {
  getData: async()=>{
    let data = await API.getData();
    return data;
  },
  getItem: async(key) => {
    let dataItem = await API.getItem(key);
    return dataItem;
  },
  setItem: async(key, value) => {
    await API.setItem(key, value);
  },
  getInterestedUsers: async(projectID) => {
    let data = await API.getInterestedUsers(projectID);
    return data;
  },
  deleteItem: (key) => {
    delete data[key];
    fs.writeFile(filePath, JSON.stringify(data, 0, 4));
  }
};