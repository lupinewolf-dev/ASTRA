export type Difficulty='tranquil'|'normal'|'hard';
export type Resource='wood'|'stone'|'ammo'|'food'|'seed';
export type Inventory=Record<Resource,number>;
export interface Point{x:number;y:number}
export interface Player extends Point{id:string;name:string;hp:number;inventory:Inventory;gunLevel:number;weapon:'pistol'|'melee';move:Point;aim:Point;firing:boolean;cooldown:number;inputAge:number;invulnerable:number}
export interface Crop extends Point{id:string;stage:'empty'|'growing'|'ready';watered:boolean;growth:number}
export interface Fence extends Point{id:string;hp:number;maxHp:number;level:number}
export interface Zombie extends Point{id:string;hp:number;cooldown:number}
export interface Node extends Point{id:string;kind:'wood'|'stone'|'supply';remaining:number;renewMs:number}
export interface Backpack extends Point{id:string;inventory:Inventory}
export interface World{version:1;id:string;timeMs:number;serial:number;difficulty:Difficulty;phase:'preparation'|'wave';remainingMs:number;warning:boolean;wave:number;players:Record<string,Player>;crops:Crop[];fences:Fence[];zombies:Zombie[];nodes:Node[];backpacks:Backpack[];storage:Inventory;processed:Record<string,string[]>;shots:{x:number;y:number;toX:number;toY:number;ttl:number}[]}
export interface Command{id:string;type:string;payload:Record<string,unknown>}
export interface Result{ok:boolean;error?:string}
