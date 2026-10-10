'use strict';
/* Compatibility route: no independent deletion engine, cron bypass or production credentials. */
module.exports=async(req,res)=>{
 const API=require('./v4-finance');
 if(req.method==='GET'){req.query={...req.query,action:'archive-list'};return API(req,res);}
 if(req.method==='POST'){
  // Batch/permanent deletion is intentionally unavailable. Explicit audited operational archival only.
  if(!req.body?.id||req.body.confirmed!==true||!req.body.reason){
   res.setHeader('Cache-Control','private, no-store');
   return res.status(409).json({ok:false,code:'EXPLICIT_RECOVERABLE_ARCHIVE_REQUIRED'});
  }
  req.query={...req.query,action:'archive-execute'};return API(req,res);
 }
 return res.status(405).json({ok:false,code:'METHOD_NOT_ALLOWED'});
};
