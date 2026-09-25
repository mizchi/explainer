// 1 ずつ増えるだけのカウンタ。count < 100 は 100 歩目に破れる。
module Bounded {
  var count: int
  action init = count' = 0
  action step = count' = count + 1
  val small = count < 100
}
