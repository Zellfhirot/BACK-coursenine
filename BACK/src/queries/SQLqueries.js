const DB = require("../bbdd/db")
const { verifyToken } = require("../middlewares/middlewares")

// -----------------------------------------------------------SIGNUP

function newStudent(nombre, email, pass, secret) {
    return new Promise((resolve, reject) => {
        DB.query(`INSERT INTO estudiantes (nombre, email, pass, secreto) VALUES ( "${nombre}", "${email}", "${pass}", "${secret}");`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

function newTeacher(nombre, email, pass, secret) {
    return new Promise((resolve, reject) => {
        DB.query(`INSERT INTO docentes (nombre, email, pass, secreto) VALUES ( "${nombre}", "${email}", "${pass}", "${secret}");`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

// -----------------------------------------------------------LOGIN

function logUser(email, pass, rol) {
    return new Promise((resolve, reject) => {
        DB.query(`SELECT * FROM ${rol} WHERE email = "${email}" AND pass = "${pass}";`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

// -----------------------------------------------------------LOGOUT

function logout(payload, newSecret, rol) {
    return new Promise((resolve, reject) => {
        DB.query(`UPDATE ${rol} SET secreto = "${newSecret}" WHERE email = "${payload.email}";`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

// -----------------------------------------------------------VERIFY TOKEN

function verification(payload, token) {
    return new Promise((resolve, reject) => {
        DB.query(`SELECT secreto, id, nombre FROM ${payload.rol} WHERE email = "${payload.email}";`, (err, result) => {
            if (err)
                return reject(err);
            try {
                if (verifyToken(token, result[0].secreto)) {
                    resolve(result);
                }
            } catch (err) {
                return reject(err)
            }
        })
    })
}

// -----------------------------------------------------------PASSWORD

function recoverAccount(email, newSecret, rol) {
    return new Promise((resolve, reject) => {
        DB.query(`UPDATE ${rol} SET secreto = "${newSecret}" WHERE email = "${email}"`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

function recoverPass(payload, token) {
    return new Promise((resolve, reject) => {
        DB.query(`SELECT secreto, id, nombre FROM ${payload.rol} WHERE email = "${payload.email}";`, (err, result) => {
            if (err)
                return reject(err);
            try {
                if (verifyToken(token, result[0].secreto)) {
                    resolve(result);
                }
            } catch (err) {
                return reject(err)
            }
        })
    })
}

function newPass(email, pass, rol) {
    return new Promise((resolve, reject) => {
        DB.query(`UPDATE ${rol} SET pass = "${pass}" WHERE email = "${email}";`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

// -----------------------------------------------------------UPDATE USER

function updateUser(nombre, email, pass, secreto, payload) {
    return new Promise((resolve, reject) => {
        DB.query(`UPDATE ${payload.rol} SET nombre = "${nombre}", email = "${email}", pass = "${pass}", secreto = "${secreto}" WHERE id = "${payload.id}";`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

// -----------------------------------------------------------SEARCH ALL

function searchAll() {
    return new Promise((resolve, reject) => {
        DB.query(`SELECT * FROM cursos ORDER BY media DESC;`, (err, result) => {
            if (err)
                return reject(err);
            DB.query(`SELECT nombre, id FROM docentes;`, (e, r) => {
                if (e)
                    return reject(e);
                const data = {
                    cursos: result,
                    docentes: r
                }
                resolve(data);
            })
        });
    });
}

// -----------------------------------------------------------SEARCH KEYS

function keywords(curso) {
    return new Promise((resolve, reject) => {
        DB.query(
            `SELECT descripcion FROM keywords
            INNER JOIN keywordsCursos
            ON keywords.id = keywordsCursos.keyword
            WHERE curso = ${curso};`,
            (err, result) => {
                if (err)
                    return reject(err);
                DB.query(
                    `SELECT descripcion FROM profesiones
                    INNER JOIN profesionesCursos
                    ON profesiones.id = profesionesCursos.profesion
                    WHERE curso = ${curso};`,
                    (e, res) => {
                        if (e)
                            return reject(e);
                        let data = {
                            keys: result.map(e => Object.values(e)[0]),
                            profs: res.map(e => Object.values(e)[0])
                        }
                        resolve(data);
                    })

            });
    });
}

// -----------------------------------------------------------NEW REVIEW


function newReview(body, payload, curso) {
    return new Promise((resolve, reject) => {
        DB.query(`INSERT IGNORE INTO reviews (estudiante, curso, descripcion, valoracion) VALUES ("${payload.id}", "${curso}", "${body.descripcion}", "${body.valoracion}");`, (err, result) => {
            if (err)
                return reject(err)
            if (result.affectedRows > 0) {
                DB.query(`
                SELECT AVG (valoracion)
                FROM reviews
                WHERE curso = ${curso};`, (e, r) => {
                    if (e)
                        throw (e)
                    DB.query(
                        `UPDATE cursos SET media = '${Object.values(r[0])[0]}' where id = ${curso};`,
                        (er, res) => {
                            if (er)
                                throw (er)
                            resolve(res);
                        })
                })
            } else {
                resolve(result)
            }

        })
    }
    )
}

// -----------------------------------------------------------GET REVIEWS AND COUNTER

function getReviews(curso) {
    return new Promise((resolve, reject) => {
        DB.query(`SELECT * FROM reviews WHERE curso = "${curso}";`, (err, result) => {
            if (err)
                return reject(err);
            DB.query(`SELECT COUNT(id) FROM reviews WHERE curso = "${curso}";`, (e, r) => {
                if (e)
                    return reject(e);
                let data = {
                    reviews: result,
                    reviewNum: Object.values(r[0])[0]
                }
                resolve(data);
            });
        })
    });
}

// -----------------------------------------------------------FAVS

function showFavs(payload, token) {
    return new Promise((resolve, reject) => {
        DB.query(`SELECT secreto, id, nombre FROM estudiantes WHERE email = "${payload.email}";`, (e, r) => {
            try {
                verifyToken(token, r[0].secreto)
                DB.query(
                    `SELECT * FROM cursos
                    INNER JOIN favoritos
                    ON cursos.id = favoritos.curso
                    WHERE estudiante = ${r[0].id};`,
                    (err, result) => {
                        if (err)
                            return reject(err);
                        let total = { result: result, nombre: r[0].nombre }
                        resolve(total);
                    });
            } catch (err) {
                return reject(err)
            }
        })
    })
}


function newFav(payload, curso) {
    return new Promise((resolve, reject) => {
        DB.query(`INSERT IGNORE INTO favoritos (curso, estudiante) VALUES ("${curso}", "${payload.id}");`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

function deleteFav(idCurso, idUser) {
    return new Promise((resolve, reject) => {
        DB.query(`DELETE FROM favoritos WHERE curso = "${idCurso}" AND estudiante = "${idUser}";`, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}

// -----------------------------------------------------------NEW COURSE

function newCourse(body, docenteId) {
    return new Promise((resolve, reject) => {
        DB.query(`INSERT INTO cursos (nombre, descripcion, enlace, docente, precio, duracion, idioma, categoria, bolsaEmpleo, certificado, media, imagen, fecha) VALUES ( "${body.nombre}", "${body.descripcion}", "${body.enlace}", "${docenteId}", "${body.precio}", "${body.duracion}", "${body.idioma}", "${body.categoria}", "${body.bolsaEmpleo}", "${body.certificado}", 0, "${body.imagen}", "${body.fecha}");`, (err1, res1) => {
            if (err1)
                return reject(err1);
            body.keys.map(key => {
                if (key.id === null) {
                    DB.query(`INSERT INTO keywords(descripcion) VALUES ("${key.descripcion}");`, (err2, res2) => {
                        if (err2)
                            return reject(err2);
                        DB.query(`INSERT INTO keywordsCursos(curso, keyword) VALUES ("${res1.insertId}", "${res2.insertId}"); `, (err3, res3) => {
                            if (err3)
                                return reject(err3);
                        })
                    })
                } else {
                    DB.query(`INSERT INTO keywordsCursos(curso, keyword) VALUES ("${res1.insertId}", "${key.id}"); `, (err4, res4) => {
                        if (err4)
                            return reject(err4)
                    })
                }
            })
            body.profs.map(prof => {
                if (prof.id === null) {
                    DB.query(`INSERT INTO profesiones(descripcion) VALUES ("${prof.descripcion}");`, (err5, res5) => {
                        if (err5)
                            return reject(err5);
                        DB.query(`INSERT INTO profesionesCursos(curso, profesion) VALUES ("${res1.insertId}", "${res5.insertId}"); `, (err6, res6) => {
                            if (err6)
                                return reject(err6);
                        })
                    })
                } else {
                    DB.query(`INSERT INTO profesionesCursos(curso, profesion) VALUES ("${res1.insertId}", "${prof.id}"); `, (err7, res7) => {
                        if (err7)
                            return reject(err7)
                    })
                }
            })
            resolve(res1);
        });
    });
}

// -------------------------------------------------------KEYS & PROFS

function keysProfs() {
    return new Promise((resolve, reject) => {
        DB.query(
            `SELECT * FROM keywords;`,
            (err, result) => {
                if (err)
                    return reject(err);
                DB.query(
                    `SELECT * FROM profesiones;`,
                    (e, res) => {
                        if (e)
                            return reject(e);
                        let data = {
                            keys: result,
                            profs: res
                        }
                        resolve(data);
                    })
            });
    });
}


// ---------------------------EXPORTS

module.exports = {
    newStudent,
    newTeacher,
    logUser,
    logout,
    verification,
    recoverAccount,
    recoverPass,
    newPass,
    updateUser,
    searchAll,
    keywords,
    newReview,
    getReviews,
    showFavs,
    newFav,
    deleteFav,
    newCourse,
    keysProfs
};