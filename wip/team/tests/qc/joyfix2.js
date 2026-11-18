const {boot,w}=require('./lib.js'); const {joyOnboard}=require('./joyfull2.js');
exports.joyAll=async(S,opts={})=>{ const {p}=S;
 await joyOnboard(S,opts);
 await S.tap('label,button,div','Emergency fund'); await S.tap('label,button,div','A trip'); await S.tap('label,button,div','Pay off a debt');
 await S.tap('#tourNext');
 // emergency: already saved 0 (her 2000 is bank)
 await S.tap('#tourNext');
 // trip
 await S.type('#tourGName','Siargao'); await S.type('#tourGCost','25000'); await S.tap('#tourNext');
 // debt
 await S.type('#tourGName','Credit card'); await S.type('#tourGCost','18000'); await S.tap('#tourNext');
 await S.shot('d01_goalsplit'); S.goalsplit=await S.txt('#tour',900); await S.tap('#tourNext');
 await S.shot('d02_play1'); await S.tap('#tourNext'); await S.shot('d03_play2'); await S.tap('#tourNext');
};
if(require.main===module)(async()=>{ const S=await boot(); await exports.joyAll(S); S.log('HOME'); console.log(S.goalsplit);
 await w(1500); await S.shot('d04_home_top'); console.log(await S.txt('body',2500)); console.log(JSON.stringify(S.errs)); await S.b.close();})();
