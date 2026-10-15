/**
 * One push-optimal solution per level (LURD, upper case = push), produced once with the
 * independent oracle solver in `oracle.ts`. Tests replay them through the real rules, so the
 * fast rules tests do not need to run the (slower) search.
 */
export const SOLUTIONS = {
  easy: [
    'LrddllulluurrD', // 2 pushes
    'RdrUluurrdLulDrdL', // 5 pushes
    'RurrddlUruLdlUruL', // 5 pushes
    'LLLrrruulDrdL', // 5 pushes
    'RddrrUULrddlluUluR', // 6 pushes
    'UUUdddrruuuulLLrddRluurrdD', // 7 pushes
    'LdllUUluRRRlldddrruLdlUUluRR', // 11 pushes
    'DLddrUUlulldRurDrruLLLdrrddlUruulldRurD', // 12 pushes
    'RurrrddlUruLLullddrUUruLdddRurrddlUruLLL', // 12 pushes
    'rddlllluRdrrruulDrddlluluRddrruLruulDlDurDlDurrdLLLrrdLL', // 13 pushes
    'DrdrruLLddlluRluurDDurDDulldRRRurDllldR', // 13 pushes
    'LdlluuluurDDDRdrUllldRurrruulDrdLLLdlUrrrdLL', // 14 pushes
    'drruruuullDrrdddllluRRdrruuulllDldRdrrUUUruLdllddRdrUUdlluurRdrU', // 14 pushes
    'DDrddllUUUdddrUruLdlUruLLulDrrruLLdlD', // 14 pushes
    'UUluurDrDulldRdRRlluurDlddrruLdlUUruLdddrrrUUU', // 15 pushes
    'UluRRurrdLdLUllddrUluRRdrUruullDurrddlUluRdddlluRdrUU' // 16 pushes
  ],
  medium: [
    'DDDldRRuuluulldRurDDrddlluRdrUluRdrU', // 12 pushes
    'LLulldRRRdrUllldddrrUUruLLulDDurrddlL', // 13 pushes
    'UUddlluuRuurrdLulDrDDrdLLLuuRurDDrdL', // 14 pushes
    'RRurrdLDDlluuRurDllddrrrdLLuluurrDullddrdrruLLruulldlddRUrrdL', // 15 pushes
    'DrrddldlluuluRRRlldddrruruUlDLulDlddrrrUruLLLDldRuuulDD', // 16 pushes
    'DlllldRurrrDullldlddrrrUUruLLrdddllluurRurDllluRdlddrrrrUdlllluurrrDrdLuuurDllluRdrddL', // 16 pushes
    'RluurDRDulldRdRRdrUUULLLdlUdrdrUluRR', // 17 pushes
    'RRurDlDulldRurrrddlUruLLLdlUdrRurrddlUluRdddlUUruLL', // 17 pushes
    'RRllddrrruruuullDrrdddlllluuuRRRurDlDLLulDurrrrDllllDurrrDurDlDurD', // 17 pushes
    'ULUUUrrddLdlUUdrruulLLdlUdddRurrddlUUUluRRlddrruU', // 18 pushes
    'RRlluurrrdrddlUUUluRdddddllUdrruuuulllddRRlddrruUUUddddlUluRdrUUruLLL', // 19 pushes
    'DDDuuulldRurDDrruLLulldRurDrddddlluuRlddrruruuullDrrddlLrruullDurDlDLrRdLL', // 20 pushes
    'LLullDRlDurDlDurDlDRdrruuruulLulDDlddrRlluurDuurrrddddlluRuruulllddldRRdrrUUlD', // 21 pushes
    'RurDDDurDuluurDDldlddrUUUUruLdddddrruLdlluururDllddrUUUUddrDrdLLL', // 22 pushes
    'DDLruulDDLdlluRddrrrULuurDlddlluuRlddrruUruulDDllddrrrUdllluurrDLulDDurrrdLLLulD', // 23 pushes
    'RRdrUUULuurDldDrddlUUUUruLLLddRurDDrddlUUUUruLdddrU' // 24 pushes
  ],
  hard: [
    'DDDlluuRurDDulldddrRluluurrdDrruLdllluurrDrdLLdlUUdrrrrddlUruLdLLulD', // 19 pushes
    'UUUrrruulllDDDDrUluRluurrrdddLruuulllddrRdrUUdllluurrRddlllddrUluRRdrUU', // 19 pushes
    'UrDRRuuullDDldRuuulDDuurrrddddrUUUlulldddRluuurrddDrddlllUUUUluRRldddrrDrdL', // 22 pushes
    'UUULuurDlllDurrdLurrDDDLLUUdddlluuuRuRldldddrrurruulUdrddlluUluRddLulDDR', // 23 pushes
    'rruUddllUUUUluRRdlddddrruuLUluurDDlDDldRRRuuruLLulDDRurDllDurrDulldldR', // 25 pushes
    'LLDurrdLLrDLdlluuuRRuulDrddrruLdlUUddLruulDlDDuurrdLDlDuruulDrdrddrUUluurrdLLL', // 26 pushes
    'UluRdlldddRluuurrdLDlddrUUUruulDrrruLLdllDDrUluRRdldddlUUruururrddddlLruruuullddldlddrUrruruuulldllDurrurrddddlllUUruRldlluRRurrDullddlddlU', // 28 pushes
    'DDrddlllUdrrUUUUUruLLddrddddlluRdrruuluulldRlDldRdrrruulUUUruLddddrddlUUUUUddllddRdrUUUUluR', // 29 pushes
    'uLuluurDulluurrDullddddlddrUUUUddddrUUUddrrdLLuuurDulluluurrrdDLLUluRdddlUUdrrrDldddrruLdlUluurrDLddrruLuullldddRRR', // 29 pushes
    'llUUddlluRRdrrUULUUruLLullddrUruLdddRDrUUruLLrdddrddlUUUUrDDlddlluRdrUUUdrD', // 30 pushes
    'UUluuuullDrdddrrddLLUUUUUluRdddddlldRRuuulDuruulDDrdddlluRdrUUUluRdlDrddlluRdrUUluRdrrddLLuuuuurrdDDD', // 31 pushes
    'UULullddrUUruLddrrddrddlllUUUUluRdddddrrULdlUUluurrrdDuulluurrDDlllddrUluururrddlLulDDurrrDullddddrrruLLdlUUUluururrdddDrdLLdlU', // 32 pushes
    'DDDLdlluRuuulldRurDDDDlddrrruUUUULLulldRurDDDuurrdLulDrrddlLrruullDlDururrdLdLDuruulDDrrddlLrruullD', // 32 pushes
    'LUUruLdddrddlUUUUdlldlddRUUluRdddRRuuLrddlluluurDrruuruulDulldRRurDlDDLdlluRdlddrrruruLLLDldRuuulDrrruLLdlD', // 33 pushes
    'DRDDlUUrurrddrdLLrrddllUdrruuuluullddlddRUluururrdddLLdlUrrruuulldRlDDrruUluRdddrddllUdrruuulullddldRuuulDurrrddLrrddllUlUUluRRldddrdrruuulUlldddlUrRRurDD', // 34 pushes
    'uuRlddRRddrruuuluuLrddrdddlluulluurRurDllluRdrrurDllluRdrrDDLUruLLrddLddrrUUluulullddddRluuuurrdrruLdddlLdlUUURlddrrrrddllUdrruuluurDldLdlluuurRlldddrrururuulDlluRdrrdDllLdlUrrrrD' // 35 pushes
  ],
  expert: [
    'UUrrdrdLLrddLUruuulldlddRUdRdrUUUUdddlluRdrUruulllDurrruulllDDrrUdlluurRddrddlUddllluRRdrUruuulullddrRurDlllDlddrrurUddllluuruuurrdrdLddrUdldllluRRdrUUUU', // 36 pushes
    'UUUURRRlluurrDrDLrDDLUruulullddlddrRdrdrUUUlDllluuruulDDuurrrdDuullddlDuuurrrddDrdLuuuulldRurDDDrddLruuluulldRurrDDuulldRdDLrurD', // 37 pushes
    'RRlDDlddRURurrdLLDlluuRRluurDldlddrrurruuuLrdddlldlluururDRdrUllllddrrUdlluurRddlddrUUUrrdLulDlluururDllddrURuulDrddrruuLrddlluRdllddrUUlluurDDrruuLrddlluRdddlUU', // 38 pushes
    'UUdRRUdlluRUUluRRRDulldddlUruurrdDLruulldDlddrUUrruulllDDrddrUluluurrrddrdLLruuulllddrUluRddRdrruLLddllUUUdddrruuLrddlUUUdddrdrUluurrdLLL', // 39 pushes
    'DrDLLruulDlDRlDuurrrdDuulldldDrUluurrrddDuuullldddlddrUluurrdLuuurDurrdLLulDDlDDrUrUUruulDldDuurrdLddLulDrddrUluuruulDDDDrUUluurrdLulDDurrrddD', // 40 pushes
    'LLDDDDrddlUruLuuuurrdLulDlluRRRdlDDDrruLUluurDDDDlUUruulldRurDDDrdddllUUUUruulldRurDDlddRDuluurDDurDD', // 41 pushes
    'DllDurrDLLDurrDulldDuurrdDrddlUUUUllddRluurrdDrddllUdrruuluullddldRuuurrddLrrddllUlUUUUruLrrDDlldddrdrruulLdlUUUruLdrrDulldddrdrruuLLdlUUUdddrdrUruLLdlU', // 41 pushes
    'DRlDDDrrddllUUUUdddlluRRuuruulDDuullddRDDrdLuuuluurrdrdLDuuullddRdrUUdlluurRRddldlddrUUUUruLLrddddddrruuLrddlluUUUUruLddddddrUruLdlUUUU', // 42 pushes
    'lllDurrrDDDldRullldRurruuullldDuurrdrddlldRurrDulldllddRUUruruuulllddDRlDuuuurrdrddrdLLruuuullldddrRdrUUUddllldRddlUUUrrrdLullddrUruruululldDDRdrruuuruLLdrdddlluRdrUUUluRdddllluuuRldddrddlUUUUdddddrR', // 43 pushes
    'UUUUUdddRRUUdrrdddllUURurDDullddrUruululDuruulDrddlDuruulDrdrddlUUUluRdddlUUddrddlUUlldRurruulDuruulDDrddLLdlUUdrrrddlUluRdrruululDrrddlUUUdddlluRdrUU', // 44 pushes
    'UUruuuLuLrdrddLruulDLruulDlDurrdrddlUruullldlddrURUdlluRuRlddrRlluurDldddRdrUUrUULLulDrrDDuuluurDDlllddrUluRurrdrddlULUllddrdrdrUUruuLrddldlluluurDrRuLruulDlDurrddlUlldRurrdddllU', // 45 pushes
    'UUddlluRdrUdrruLUUULuurDDDDDrdLLLuRdrUUUUluurDllldRurrDDDuuullddRUUddDrDrdLLUUUUruLLdrrDDlddrruLdlUUUU', // 47 pushes
    'UUddrruLUUUddlDuruulDurrrdrddLLdlUUUluRRlluurDurDllddrddrrruuuuLLulldddrddlUUddrrrruuuullulldRDDlddrrrruuuulLulldDrdDldRRRlluuuluurDDurrrddlUruLLulldRdRRlluurDldRurrDulldlDuurrrdDuulldRurDllldDlUddR', // 48 pushes
    'LLulDrrruLdllDDDlddrUUUUluRRRurDllluRdrrDDlUruLLulDrrruLdllDDDuuurrddrDuuullldddlddrUUUUluRRRddrdDlUruuluurDllluRdrrDDDlUUruLLulDrrruLdllDDDlddrUUUUluRRRurDllluRRdrD' // 61 pushes
  ]
} as const;
