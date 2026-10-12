import {randomBytes,randomUUID,scrypt as rawScrypt,timingSafeEqual} from 'node:crypto';import {promisify} from 'node:util';
import type {IncomingHttpHeaders} from 'node:http';import type {Store} from './store.js';
const scrypt=promisify(rawScrypt);export const token=()=>randomBytes(32).toString('hex');
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64) as Buffer;return `${salt}:${hash.toString('hex')}`}
export async function verifyPassword(password:string,stored:string){const [salt,h]=stored.split(':');const expected=Buffer.from(h,'hex');const actual=await scrypt(password,salt,64) as Buffer;return expected.length===actual.length&&timingSafeEqual(expected,actual)}
export function sessionToken(headers:IncomingHttpHeaders){return headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('astra_session='))?.slice(14)}
export function authenticated(store:Store,headers:IncomingHttpHeaders):{id:string;username:string}|null{const t=sessionToken(headers);if(!t)return null;const row=store.db.prepare('SELECT accounts.id,username FROM sessions JOIN accounts ON accounts.id=sessions.account_id WHERE token=? AND expires>?').get(t,Date.now());return row?{id:String(row.id),username:String(row.username)}:null}
export function issueSession(store:Store,id:string){const t=token();store.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());store.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(t,id,Date.now()+30*86400000);return t}
export const accountId=()=>randomUUID();
export function allowedOrigin(origin:string|undefined,host:string|undefined,configured?:string){if(!origin)return false;const allowed=configured?.split(',').map(s=>s.trim()).filter(Boolean)??[`http://${host}`];return allowed.includes(origin)}
