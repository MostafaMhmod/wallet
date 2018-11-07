/*
 * @project: TERA
 * @version: Development (beta)
 * @copyright: Yuriy Ivanov 2017-2018 [progr76@gmail.com]
 * @license: Not for evil
 * GitHub: https://github.com/terafoundation/wallet
 * Twitter: https://twitter.com/terafoundation
 * Telegram: https://web.telegram.org/#/im?p=@terafoundation
*/

var START_NONCE = 0;
const COUNT_FIND_HASH1 = 64;
const DELTA_LONG_MINING = 5000;
var BLOCKNUM_ALGO2 = 6560000;
if(global.LOCAL_RUN || global.TEST_NETWORK)
{
    BLOCKNUM_ALGO2 = 0;
}
require('./library.js');
require('./crypto-library.js');

function GetHashFromSeqAddr(SeqHash,AddrHash,BlockNum,PrevHash)
{
    if(BlockNum < BLOCKNUM_ALGO2)
    {
        var Hash = shaarrblock2(SeqHash, AddrHash, BlockNum);
        return {Hash:Hash, PowHash:Hash, Hash1:Hash, Hash2:Hash};
    }
    var MinerID = ReadUintFromArr(AddrHash, 0);
    var Nonce0 = ReadUintFromArr(AddrHash, 6);
    var Nonce1 = ReadUintFromArr(AddrHash, 12);
    var Nonce2 = ReadUintFromArr(AddrHash, 18);
    var DeltaNum1 = ReadUint16FromArr(AddrHash, 24);
    var DeltaNum2 = ReadUint16FromArr(AddrHash, 26);
    var PrevHashNum;
    if(PrevHash)
    {
        PrevHashNum = ReadUint32FromArr(PrevHash, 28);
    }
    else
    {
        PrevHashNum = ReadUint32FromArr(AddrHash, 28);
    }
    return GetHash(SeqHash, PrevHashNum, BlockNum, MinerID, Nonce0, Nonce1, Nonce2, DeltaNum1, DeltaNum2);
};

function GetHash(BlockHash,PrevHashNum,BlockNum,Miner,Nonce0,Nonce1,Nonce2,DeltaNum1,DeltaNum2)
{
    if(DeltaNum1 > DELTA_LONG_MINING)
        DeltaNum1 = 0;
    if(DeltaNum2 > DELTA_LONG_MINING)
        DeltaNum2 = 0;
    var HashBase = GetHashFromNum2(BlockNum, PrevHashNum);
    var HashCurrent = GetHashFromArrNum2(BlockHash, Miner, Nonce0);
    var HashNonce1 = GetHashFromNum3(BlockNum - DeltaNum1, Miner, Nonce1);
    var HashNonce2 = GetHashFromNum3(BlockNum - DeltaNum2, Miner, Nonce2);
    var Hash1 = XORArr(HashBase, HashNonce1);
    var Hash2 = XORArr(HashCurrent, HashNonce2);
    var Ret = {Hash:Hash2, Hash1:Hash1, Hash2:Hash2};
    if(CompareArr(Hash1, Hash2) > 0)
    {
        Ret.PowHash = Hash1;
    }
    else
    {
        Ret.PowHash = Hash2;
    }
    if(BlockNum >= global.BLOCKNUM_HASH_NEW)
    {
        Ret.Hash = shaarr2(Hash1, Hash2);
    }
    return Ret;
};

function XORArr(Arr1,Arr2)
{
    var Ret = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for(var i = 0; i < 32; i++)
    {
        Ret[i] = Arr1[i] ^ Arr2[i];
    }
    return Ret;
};

function GetHashFromNum2(Value1,Value2)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(MeshArr, Value1, 0);
    WriteUintToArrOnPos(MeshArr, Value2, 6);
    return sha3(MeshArr);
};

function GetHashFromArrNum2(Arr,Value1,Value2)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0];
    WriteArrToArrOnPos(MeshArr, Arr, 0, 32);
    WriteUintToArrOnPos(MeshArr, Value1, 32);
    WriteUintToArrOnPos(MeshArr, Value2, 38);
    return sha3(MeshArr);
};

function GetHashFromNum3(Value1,Value2,Value3)
{
    var MeshArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(MeshArr, Value1, 0);
    WriteUintToArrOnPos(MeshArr, Value2, 6);
    WriteUintToArrOnPos(MeshArr, Value3, 12);
    return sha3(MeshArr);
};
global.GetHashFromSeqAddr = GetHashFromSeqAddr;
global.CalcHashBlockFromSeqAddr = CalcHashBlockFromSeqAddr;
global.CreateHashMinimal = CreateHashMinimal;
global.StartNumNewAlgo = StartNumNewAlgo;
global.CreatePOWVersionX = CreatePOWVersion3;

function StartNumNewAlgo()
{
    return BLOCKNUM_ALGO2;
};

function CalcHashBlockFromSeqAddr(Block,PrevHash)
{
    var Value = GetHashFromSeqAddr(Block.SeqHash, Block.AddrHash, Block.BlockNum, PrevHash);
    Block.Hash = Value.Hash;
    Block.PowHash = Value.PowHash;
};

function CreateHashMinimal(Block,MinerID)
{
    if(Block.BlockNum < BLOCKNUM_ALGO2)
    {
        return false;
    }
    var PrevHashNum = ReadUint32FromArr(Block.PrevHash, 28);
    var Ret = GetHash(Block.SeqHash, PrevHashNum, Block.BlockNum, MinerID, 0, 0, 0, 0, 0);
    Block.Hash = Ret.Hash;
    Block.PowHash = Ret.PowHash;
    Block.Power = GetPowPower(Block.PowHash);
    Block.AddrHash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    WriteUintToArrOnPos(Block.AddrHash, MinerID, 0);
    WriteUint32ToArrOnPos(Block.AddrHash, PrevHashNum, 28);
    return true;
};
var MAX_MEMORY3 = 0, SHIFT_MASKA3;
var BufferNonce3, BufferBlockNum3;
var bWasInitVer3;

function InitVer3(Block)
{
    bWasInitVer3 = 1;
    if(Block.ProcessMemorySize > 0)
    {
        var MAXARRAYSIZE = (1 << 30) * 2 - 1;
        var MaxArrCount = Math.min(Math.trunc(Block.ProcessMemorySize / 8), MAXARRAYSIZE);
        var BitCount = 0;
        MAX_MEMORY3 = 1;
        for(var b = 0; b < 32; b++)
        {
            if(MAX_MEMORY3 > MaxArrCount)
            {
                BitCount--;
                MAX_MEMORY3 = MAX_MEMORY3 / 2;
                break;
            }
            BitCount++;
            MAX_MEMORY3 = MAX_MEMORY3 * 2;
        }
        SHIFT_MASKA3 = 32 - BitCount;
        BufferNonce3 = new Uint32Array(MAX_MEMORY3);
        BufferBlockNum3 = new Uint32Array(MAX_MEMORY3);
        ToLog("MAX HASH ITEMS=" + Math.trunc(MAX_MEMORY3 / 1024 / 1024) + " M");
    }
};

function CreatePOWVersion3(Block)
{
    if(!bWasInitVer3)
        InitVer3(Block);
    if(!MAX_MEMORY3)
        return 0;
    if(!Block.LastNonce)
        Block.LastNonce = 0;
    if(!Block.HashCount)
        Block.HashCount = 0;
    if(!Block.LastNonce0)
        Block.LastNonce0 = 0;
    if(!Block.MaxLider)
    {
        Block.HashCount = 0;
        Block.MaxLider = {Nonce0:0, Nonce1:0, Nonce2:0, DeltaNum1:0, DeltaNum2:0, Hash1:[255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], Hash2:[255,
            255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255], };
    }
    var MaxLider = Block.MaxLider;
    var RunCount = Block.RunCount;
    var LastNonce = Block.LastNonce;
    var BlockNum = Block.BlockNum;
    var Miner = Block.MinerID;
    for(var nonce = 0; nonce < RunCount; nonce++)
    {
        var Nonce = Math.trunc(4000000000 * Math.random());
        var HashNonce = GetHashFromNum3(BlockNum, Miner, Nonce);
        var HashNum = ReadIndexFromArr(HashNonce);
        var Index = HashNum;
        BufferNonce3[Index] = Nonce;
        BufferBlockNum3[Index] = BlockNum;
    }
    Block.LastNonce += RunCount;
    var Ret = 0;
    var PrevHashNum = ReadUint32FromArr(Block.PrevHash, 28);
    var HashBase = GetHashFromNum2(BlockNum, PrevHashNum);
    var Value1 = FindHashBuffer3(HashBase, BlockNum, Miner, COUNT_FIND_HASH1);
    if(Value1)
    {
        var Hash1 = XORArr(HashBase, Value1.Hash);
        if(CompareArr(MaxLider.Hash1, Hash1) > 0)
        {
            MaxLider.Hash1 = Hash1;
            MaxLider.Nonce1 = Value1.Nonce;
            MaxLider.DeltaNum1 = Value1.DeltaNum;
            Ret = 1;
        }
    }
    START_NONCE = Block.LastNonce0;
    Block.LastNonce0 += Block.RunCount0;
    var CountEnd = START_NONCE + Block.RunCount0;
    for(var Nonce0 = START_NONCE; Nonce0 < CountEnd; Nonce0++)
    {
        var HashCurrent = GetHashFromArrNum2(Block.SeqHash, Miner, Nonce0);
        var Value2 = FindHashBuffer3(HashCurrent, BlockNum, Miner, 1);
        if(Value2)
        {
            var Hash2 = XORArr(HashCurrent, Value2.Hash);
            if(CompareArr(MaxLider.Hash2, Hash2) > 0)
            {
                MaxLider.Nonce0 = Nonce0;
                MaxLider.Hash2 = Hash2;
                MaxLider.Nonce2 = Value2.Nonce;
                MaxLider.DeltaNum2 = Value2.DeltaNum;
                Ret = 1;
            }
        }
    }
    if(Ret)
    {
        Block.AddrHash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        WriteUintToArrOnPos(Block.AddrHash, Miner, 0);
        WriteUintToArrOnPos(Block.AddrHash, MaxLider.Nonce0, 6);
        WriteUintToArrOnPos(Block.AddrHash, MaxLider.Nonce1, 12);
        WriteUintToArrOnPos(Block.AddrHash, MaxLider.Nonce2, 18);
        WriteUint16ToArrOnPos(Block.AddrHash, MaxLider.DeltaNum1, 24);
        WriteUint16ToArrOnPos(Block.AddrHash, MaxLider.DeltaNum2, 26);
        WriteUint32ToArrOnPos(Block.AddrHash, PrevHashNum, 28);
        Block.Hash = MaxLider.Hash2;
        if(CompareArr(MaxLider.Hash1, MaxLider.Hash2) > 0)
        {
            Block.PowHash = MaxLider.Hash1;
        }
        else
        {
            Block.PowHash = MaxLider.Hash2;
        }
        if(BlockNum >= global.BLOCKNUM_HASH_NEW)
        {
            Block.Hash = shaarr2(MaxLider.Hash1, MaxLider.Hash2);
        }
        var Power = GetPowPower(Block.PowHash);
        Block.HashCount = (1 << Power) >>> 0;
    }
    return Ret;
};

function FindHashBuffer3(HashFind,BlockNum,Miner,CountFind)
{
    var HashNum = ReadIndexFromArr(HashFind);
    for(var i = 0; i < CountFind; i++)
    {
        var Index = HashNum ^ i;
        var BlockNum2 = BufferBlockNum3[Index];
        if(BlockNum2 && BlockNum2 > BlockNum - DELTA_LONG_MINING)
        {
            var Nonce2 = BufferNonce3[Index];
            var Hash2 = GetHashFromNum3(BlockNum2, Miner, Nonce2);
            return {Hash:Hash2, DeltaNum:BlockNum - BlockNum2, Nonce:Nonce2};
        }
    }
    return undefined;
};

function ReadIndexFromArr(arr)
{
    var value = (arr[0] << 23) * 2 + (arr[1] << 16) + (arr[2] << 8) + arr[3];
    value = value >>> SHIFT_MASKA3;
    return value;
};