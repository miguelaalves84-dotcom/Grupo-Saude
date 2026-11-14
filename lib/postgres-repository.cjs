'use strict';
function repository(pool){return{query:async(q,p=[])=>(await pool.query(q,p)).rows,batch:async statements=>{const c=await pool.connect();try{await c.query('BEGIN ISOLATION LEVEL SERIALIZABLE');const out=[];for(const s of statements)out.push((await c.query(s.sql,s.params||[])).rows);await c.query('COMMIT');return out}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}}}
module.exports={repository};
