const mysql = require('mysql2/promise');
const yaml = require('yaml-config')
const config = yaml.readConfig("./config/config.yml",'default');

const connection = mysql.createPool({
  host: config.host,
  user: config.user,
  password: config.password,
  port: config.port,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
async function getConnection() {
  return await connection.getConnection();
}

class LetsCollabStudentsAPI{
  constructor(){
    this.connectionPromise = getConnection();
  }
  async insertStudent(student) {
    const connection = await this.connectionPromise;
    await connection.execute(
      `INSERT INTO Students (Email, FirstName, LastName, GoogleID, Year, Description)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [student.Email, student.FirstName, student.LastName, student.GoogleID, student.Year, student.Description]
    );
  }
  
  async insertStudentSkills(student) {
    const connection = await this.connectionPromise;
    for (const skill of student.Skills) {
      if (skill) {
        await connection.execute(
          `INSERT INTO StudentSkills (Email, SkillName) VALUES (?, ?)`,
          [student.Email, skill]
        );
      }
    }
  }
  async addProjectInterest(studentEmail, projectID) {
    const connection = await this.connectionPromise;
    try{
      const[result] = await connection.execute(
        `INSERT INTO InterestedUsers (Email, ProjectID) VALUES (?, ?)`,
        [studentEmail, projectID]
      );
      if (result.affectedRows > 0) {
        return true; // Indicates success
      } else {
        return false; // Indicates failure
      }
    }catch(error){
      console.error('Failed to add interest in project:', error);

      return false; // Indicates failure
    }
    
  }
  async removeProjectInterest(studentEmail, projectID) {
    const connection = await this.connectionPromise;
    try{
      const[result] = await connection.execute(
        `DELETE FROM InterestedUsers WHERE Email = ? AND ProjectID = ?`,
        [studentEmail, projectID]
      );
      if (result.affectedRows > 0) {
        return true; // Indicates success
      } else {
        return false; // Indicates failure
      }
    }catch(error){
      console.error('Failed to remove interest project:', error);
      return false; // Indicates failure
    }
  }
  async getProjectsCreated(studentEmail) {
    const connection = await this.connectionPromise;
    const [rows] = await connection.execute(
      `SELECT ProjectID FROM ProjectsCreated WHERE CreatorEmail = ?`,
      [studentEmail]
    );
    return rows.map((row) => row.ProjectID);
  }
  async getInterestedProjects(studentEmail) {
    const connection = await this.connectionPromise;
    const [rows] = await connection.execute(
      `SELECT ProjectID FROM InterestedUsers WHERE Email = ?`,
      [studentEmail]
    );
    return rows.map((row) => row.ProjectID);
  }
  

  async insertProjectsInterested(student) {
    const connection = await this.connectionPromise;
    for (const projectId of student.ProjectsInterested) {
      await connection.execute(
        `INSERT INTO InterestedUsers (Email, ProjectID) VALUES (?, ?)`,
        [student.Email, projectId]
      );
    }
  }
  async deleteAllStudentSkills(student) {
    const connection = await this.connectionPromise;
    await connection.execute(
      `DELETE FROM StudentSkills WHERE Email = ?`,
      [student.Email]
    );
  }
  async deleteAllStudentInterests(student) {
    const connection = await this.connectionPromise;
    await connection.execute(
      `DELETE FROM InterestedUsers WHERE Email = ?`,
      [student.Email]
    );
  }
  async createNewStudent(student) {
    const connection = await this.connectionPromise;

    try {

      await connection.beginTransaction();
      
      await this.insertStudent(student);

      await this.insertStudentSkills(student);
      
  
      await connection.commit();
      console.log('All student profiles have been successfully inserted.');
    } catch (error) {
      console.error('Failed to insert student profiles:', error);
      if (connection) {
        await connection.rollback();
      }
    } finally {
      if (connection) {
        await connection.release();
      }
    }
  }
  async updateStudentInfo(studentObject){
    await connection.execute(
      `UPDATE Students 
       SET FirstName = ?, LastName = ?, GoogleID = ?, Year = ?, Description = ? 
       WHERE Email = ?`,
      [studentObject.FirstName, studentObject.LastName, studentObject.GoogleID, studentObject.Year, studentObject.Description, studentObject.Email]
    );
  }
  async updateStudent(studentObject) {
    const connection = await this.connectionPromise;
    try {
      await connection.beginTransaction();

      // Update basic student information
      await this.updateStudentInfo(studentObject);

      // Update StudentSkills
      // Clear existing skills for this student
      await this.deleteAllStudentSkills(studentObject);
      // Re-add current skills
      await this.insertStudentSkills(studentObject);  

      // Update InterestedUsers
      // Clear existing project interests for this student
      await this.deleteAllStudentInterests(studentObject);
      // Re-add current project interests
      await this.insertProjectsInterested(studentObject);

      await connection.commit();
    } catch (error) {
      console.error('Failed to update student profile:', error);
      await connection.rollback();
      throw error; // Rethrow or handle as needed
    }
  }

  async userExist(userID) {
    const connection = await this.connectionPromise;
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS count FROM Students WHERE Email = ?`,
      [userID]
    );
    return rows[0].count > 0;
  }

  
  async setItem(studentEmail, student) {
    const exists = await this.userExist(studentEmail);
    if (exists) {
      await this.updateStudent(student);
    } else {
      await this.createNewStudent(student);
    }
  }
  async getItem(studentEmail) {
    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT
          JSON_OBJECT(
            'FirstName', p.FirstName,
            'LastName', p.LastName,
            'Description', p.Description,
            'GoogleID', p.GoogleID,
            'Year', p.Year,
            'Email', p.Email,
            'Skills', (
              SELECT JSON_ARRAYAGG(s.SkillName)
              FROM StudentSkills ps
              JOIN Skills s ON ps.SkillName = s.SkillName
              WHERE ps.Email = p.Email
            ),
            'ProjectsCreated', (
              SELECT JSON_ARRAYAGG(ps.ProjectID)
              FROM ProjectsCreated ps
              WHERE ps.CreatorEmail = p.Email
            ),
            'ProjectsInterested', (
              SELECT JSON_ARRAYAGG(ps.ProjectID)
              FROM InterestedUsers ps
              WHERE ps.Email = p.Email
            )
          ) AS UserDetails
        FROM Students p
        WHERE p.Email = ?
        GROUP BY p.Email
      `,[studentEmail]);
      if (rows.length > 0) {
        let out_obj = {};
        if(rows[0].UserDetails){
          out_obj = rows[0].UserDetails;
          if(out_obj['ProjectsInterested'] == null){
            out_obj['ProjectsInterested'] = [];
          }
          if(out_obj['ProjectsCreated'] == null){
            out_obj['ProjectsCreated'] = [];
          }
          if(out_obj['Skills'] == null){
            out_obj['Skills'] = [];
          }
        }
        return out_obj
      } else {
        console.log('No user found with the given ID.');
        return null;
      }
    }catch (error) {
      console.error('Failed to fetch student details:', error);
      return null;
    }finally{
      if (connection) {
        await connection.release();
      }      
    }
  }
  async getData() {
    let connection = await getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT
          JSON_OBJECT(
            'FirstName', p.FirstName,
            'LastName', p.LastName,
            'Description', p.Description,
            'GoogleID', p.GoogleID,
            'Year', p.Year,
            'Email', p.Email,
            'Skills', (
              SELECT JSON_ARRAYAGG(s.SkillName)
              FROM StudentSkills ps
              JOIN Skills s ON ps.SkillName = s.SkillName
              WHERE ps.Email = p.Email
            ),
            'ProjectsCreated', (
              SELECT JSON_ARRAYAGG(ps.ProjectID)
              FROM ProjectsCreated ps
              WHERE ps.CreatorEmail = p.Email
            ),
            'ProjectsInterested', (
              SELECT JSON_ARRAYAGG(ps.ProjectID)
              FROM InterestedUsers ps
              WHERE ps.Email = p.Email
            )
          ) AS UserDetails
        FROM Students p
        GROUP BY p.Email
      `);
      if (rows.length > 0) {
        let out_obj = {};
        
        rows.map((user) => {
          let user_ = user.UserDetails;
          if(user_['ProjectsInterested'] == null){
            user_['ProjectsInterested'] = [];
          }
          if(user_['ProjectsCreated'] == null){
            user_['ProjectsCreated'] = [];
          }
          if(user_['Skills'] == null){
            user_['Skills'] = [];
          }
          out_obj[user_.Email] = user_;
          
        });
        return out_obj
      } else {
        console.log('No project found with the given ID.');
        return null;
      }
    }catch (error) {
      console.error('Failed to fetch student details:', error);
      return null;
    }finally{
      if (connection) {
        await connection.release();
      }      
    }
  }
            

}

class LetsCollabProjectsAPI{
    constructor(){
      this.connectionPromise = getConnection();
    }
    async projectExists(projectId) {
      const connection = await this.connectionPromise;
      try{
      const [rows] = await connection.execute(
        `SELECT COUNT(*) AS count FROM Projects WHERE ID = ?`,
        [projectId]
      );
      return rows[0].count > 0;
      }finally{
        if (connection) {
          await connection.release();
        }      
      }
    }

    async insertProject(project) {
      const connection = await this.connectionPromise;
      await connection.execute(
        `INSERT INTO Projects (ID, Name, Description, CoverImage, PeopleRequired, AuthorEmail, CreatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [project.ID, project.Name, project.Description, project.CoverImage, project.PeopleRequired, project.AuthorEmail, project.CreatedAt]
      );
    }
  
    async insertMeetup(project) {
      if (!project.Meetup) return;
      const connection = await this.connectionPromise;
      await connection.execute(
        `INSERT INTO Meetup (ProjectID, Time, Location)
         VALUES (?, ?, ?)`,
        [project.ID, project.Meetup.Time, project.Meetup.Location]
      );
    }
    async getInterestedUsers(projectID) {
      const connection = await this.connectionPromise;
      const [rows] = await connection.execute(
        `SELECT Email FROM InterestedUsers WHERE ProjectID = ?`,
        [projectID]
      );
      return rows.map((row) => row.Email);
    }
  
    async insertProjectsCreated(project) {
      const connection = await this.connectionPromise;
      await connection.execute(
        `INSERT INTO ProjectsCreated (CreatorEmail, ProjectID) VALUES (?, ?)`,
        [project.AuthorEmail, project.ID]
      );
    }
  
    async insertProjectSkills(project) {
      const connection = await this.connectionPromise;
      for (const skill of project['Skills Desired']) {
        // Assume skill already exists for simplification
        await connection.execute(
          `INSERT INTO ProjectSkills (ProjectID, SkillName) VALUES (?, ?)`,
          [project.ID, skill]
        );
      }
    }

    async deleteAllProjectSkills(project) {
      const connection = await this.connectionPromise;
      await connection.execute(
        `DELETE FROM ProjectSkills WHERE ProjectID = ?`,
        [project.ID]
      );
    }
  
    async insertInterestedUsers(project) {
      const connection = await this.connectionPromise;
      for (const userEmail of project['Interested Users']) {
        await connection.execute(
          `INSERT INTO InterestedUsers (Email, ProjectID) VALUES (?, ?)`,
          [userEmail, project.ID]
        );
      }
    }
    async createNewProject(project) {
      const connection = await this.connectionPromise;
      await connection.beginTransaction();
      try {
        await this.insertProject(project); 
        await this.insertMeetup(project);
        await this.insertProjectsCreated(project);
        await this.insertProjectSkills(project);
        await this.insertInterestedUsers(project);
    
        await connection.commit();
        console.log('Project data has been successfully inserted.');
        return true;
      } catch (error) {
        console.error('Failed to insert project data:', error);
        await connection.rollback();
        return false;
      } finally {
        console.log('Releasing connection');
        await connection.release();
      }
    }
    async updateProjectInfo(project){
      await connection.execute(
        `UPDATE Projects 
         SET Name = ?, Description = ?, CoverImage = ?, PeopleRequired = ?, AuthorEmail = ?, CreatedAt = ? 
         WHERE ID = ?`,
        [project.Name, project.Description, project.CoverImage, project.PeopleRequired, project.AuthorEmail, project.CreatedAt, project.ID]
      );
    }
    async updateMeetupTime(project){
      await connection.execute(
        `UPDATE Meetup SET Time = ?, Location = ? WHERE ProjectID = ?`,
        [project.Meetup.Time, project.Meetup.Location, project.ID]
      );
    }
    async updateProject(project) {
      const connection = await this.connectionPromise;
      try {
        await connection.beginTransaction();
    
        await this.updateProjectInfo(project);
        await this.updateMeetupTime(project);
    
        // Update Skills
        // First, remove all current associations
        await this.deleteAllProjectSkills(project);
    
        // Then, re-add the current skills from the project object
        await this.insertProjectSkills(project);
    
        await connection.commit();
      } catch (error) {
        console.error('Failed to update project:', error);
        await connection.rollback();
        throw error; // It's good practice to re-throw the error after handling it.
      }finally{
        if (connection) {
          await connection.release();
        }      
      }
    }
    

    async setItem(projectId, project) {
      const exists = await this.projectExists(projectId);
      if (exists) {
        await this.updateProject(project);
      } else {
        await this.createNewProject(project);
      }
    }
    async getItem(projectId) {
      const connection = await this.connectionPromise;
      try {
        const [rows] = await connection.execute(`
          SELECT
            JSON_OBJECT(
              'ID', p.ID,
              'Name', p.Name,
              'Description', p.Description,
              'Meetup', JSON_OBJECT(
                'Time', m.Time,
                'Location', m.Location
              ),
              'Skills Desired', (
                SELECT JSON_ARRAYAGG(s.SkillName)
                FROM ProjectSkills ps
                JOIN Skills s ON ps.SkillName = s.SkillName
                WHERE ps.ProjectID = p.ID
              ),
              'CoverImage', p.CoverImage,
              'PeopleRequired', p.PeopleRequired,
              'Interested Users', (
                SELECT JSON_ARRAYAGG(iu.Email)
                FROM InterestedUsers iu
                WHERE iu.ProjectID = p.ID
              ),
              'AuthorEmail', p.AuthorEmail,
              'CreatedAt', p.CreatedAt
            ) AS ProjectDetails
          FROM Projects p
          LEFT JOIN Meetup m ON p.ID = m.ProjectID
          WHERE p.ID = ?
          GROUP BY p.ID
        `,[projectId]);
  
        if (rows.length > 0) {
          let out_obj = {};
          if(rows[0].ProjectDetails){
            out_obj = rows[0].ProjectDetails;
            if(out_obj['Interested Users'] == null){
              out_obj['Interested Users'] = [];
            }
            if(out_obj['Skills Desired'] == null){
              out_obj['Skills Desired'] = [];
            }
            if(out_obj['Meetup'] == null){
              out_obj['Meetup'] = {};
            }
          }
          return out_obj
        } else {
          console.log('No project found with the given ID.');
          return null;
        }
      } catch (error) {
        console.error('Failed to fetch project details:', error);
        return null;
      } finally {
        await connection.release();
      }
    }


    async getData() {
    const connection = await this.connectionPromise;
    try {
      const [rows] = await connection.execute(`
        SELECT
          JSON_OBJECT(
            'ID', p.ID,
            'Name', p.Name,
            'Description', p.Description,
            'Meetup', JSON_OBJECT(
              'Time', m.Time,
              'Location', m.Location
            ),
            'Skills Desired', (
              SELECT JSON_ARRAYAGG(s.SkillName)
              FROM ProjectSkills ps
              JOIN Skills s ON ps.SkillName = s.SkillName
              WHERE ps.ProjectID = p.ID
            ),
            'CoverImage', p.CoverImage,
            'PeopleRequired', p.PeopleRequired,
            'Interested Users', (
              SELECT JSON_ARRAYAGG(iu.Email)
              FROM InterestedUsers iu
              WHERE iu.ProjectID = p.ID
            ),
            'AuthorEmail', p.AuthorEmail,
            'CreatedAt', p.CreatedAt
          ) AS ProjectDetails
        FROM Projects p
        LEFT JOIN Meetup m ON p.ID = m.ProjectID
        GROUP BY p.ID
      `);

      if (rows.length > 0) {
        let out_obj = {};
        rows.map((project) => {
          let project_ = project.ProjectDetails;
          if(project_['Interested Users'] == null){
            project_['Interested Users'] = [];
          }
          if(project_['Skills Desired'] == null){
            project_['Skills Desired'] = [];
          }
          if(project_['Meetup'] == null){
            project_['Meetup'] = {};
          }
          out_obj[project_.ID] = project_;
          
        });
        return out_obj
      } else {
        console.log('No project found with the given ID.');
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch project details:', error);
      return null;
    } finally {
      await connection.release();
      //return null;
    }
    }

}

class LetsCollabSkillAPI{
  constructor(){
    this.connectionPromise = getConnection();
  }

  async skillExist(skillName) {
    const connection = await this.connectionPromise;
    const [rows] = await connection.execute(
      `SELECT SkillName FROM Skills WHERE SkillName = ?`,
      [skillName]
    );
    if (rows.length > 0) {
      return true;
    } else {
      return false;
    }
  }
 

  async getData() {
    const connection = await this.connectionPromise;
    try {
      const [rows] = await connection.execute(`
        SELECT SkillName FROM Skills
      `);
      if (rows.length > 0) {
        return rows.map((row) => row.SkillName);
      } else {
        console.log('No skills found.');
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      return null;
    } finally {
      await connection.release();
    }
  
}
}

module.exports = {
  LetsCollabStudentsAPI,
  LetsCollabProjectsAPI,
  LetsCollabSkillAPI
};