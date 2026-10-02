---
type: llm
weight: 1
focus: trace
---
作業の記録から、資料に付けた図のファイルの中身を見る。
PASS の条件：合格の基準になる線（キャリブレーションの対角線、PR の陽性率の線、binned residual の ±2SE のバンドなど）を、
破線（strokeDash、stroke-dasharray、linestyle="--" など）で描くよう指定している。基準の線が無い、または実線だけなら FAIL。図が無ければ FAIL。
