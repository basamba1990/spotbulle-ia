const { sequelize } = require("./src/config/db");
const { exec } = require("child_process");

const resetDatabase = async () => {
  try {
    console.log("Réinitialisation de la base de données...");

    // Supprimer toutes les tables
    await sequelize.drop();
    console.log("Toutes les tables ont été supprimées.");

    // Exécuter les migrations
    await new Promise((resolve, reject) => {
      const migrate = exec(
        "npx sequelize-cli db:migrate",
        { env: process.env },
        (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve(stdout);
          }
        }
      );

      migrate.stdout.pipe(process.stdout);
      migrate.stderr.pipe(process.stderr);
    });
    console.log("Les migrations ont été exécutées.");

    // Exécuter les seeders (si vous en avez)
    // await new Promise((resolve, reject) => {
    //   const seed = exec(
    //     "npx sequelize-cli db:seed:all",
    //     { env: process.env },
    //     (err, stdout, stderr) => {
    //       if (err) {
    //         reject(err);
    //       } else {
    //         resolve(stdout);
    //       }
    //     }
    //   );
    //   seed.stdout.pipe(process.stdout);
    //   seed.stderr.pipe(process.stderr);
    // });
    // console.log("Les seeders ont été exécutés.");

    console.log("La base de données a été réinitialisée avec succès.");
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de la base de données :", error);
  } finally {
    await sequelize.close();
  }
};

resetDatabase();
