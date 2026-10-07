/**
 * One push-optimal solution per level (LURD, upper case = push), produced once with the
 * independent oracle solver in `oracle.ts`. Tests replay them through the real rules, so the
 * fast rules tests do not need to run the (slower) search.
 */
// @ts-nocheck

export const SOLUTIONS = {
  easy: [
    'LrddllulluurrD', // 2 pushes
    'RdrUluurrdLulDrdL', // 5 pushes
    'RurrddlUruLdlUruL', // 5 pushes
    'LLLrrruulDrdL', // 5 pushes
    'RddrrUULrddlluUluR', // 6 pushes
    'UUUdddrruuuulLLrddRluurrdD', // 7 pushes
    'LdllUUluRRRlldddrruLdlUUluRR', // 11 pushes
    'DLddrUUlulldRurDrruLLLdrrddlUruulldRurD' // 12 pushes
  ],
  medium: [
    'DDDldRRuuluulldRurDDrddlluRdrUluRdrU', // 12 pushes
    'LLulldRRRdrUllldddrrUUruLLulDDurrddlL', // 13 pushes
    'UUddlluuRuurrdLulDrDDrdLLLuuRurDDrdL', // 14 pushes
    'RRurrdLDDlluuRurDllddrrrdLLuluurrDullddrdrruLLruulldlddRUrrdL', // 15 pushes
    'DrrddldlluuluRRRlldddrruruUlDLulDlddrrrUruLLLDldRuuulDD', // 16 pushes
    'DlllldRurrrDullldlddrrrUUruLLrdddllluurRurDllluRdlddrrrrUdlllluurrrDrdLuuurDllluRdrddL', // 16 pushes
    'RluurDRDulldRdRRdrUUULLLdlUdrdrUluRR', // 17 pushes
    'RRurDlDulldRurrrddlUruLLLdlUdrRurrddlUluRdddlUUruLL' // 17 pushes
  ],
  hard: [
    'DDDlluuRurDDulldddrRluluurrdDrruLdllluurrDrdLLdlUUdrrrrddlUruLdLLulD', // 19 pushes
    'UUUrrruulllDDDDrUluRluurrrdddLruuulllddrRdrUUdllluurrRddlllddrUluRRdrUU', // 19 pushes
    'UrDRRuuullDDldRuuulDDuurrrddddrUUUlulldddRluuurrddDrddlllUUUUluRRldddrrDrdL', // 22 pushes
    'UUULuurDlllDurrdLurrDDDLLUUdddlluuuRuRldldddrrurruulUdrddlluUluRddLulDDR', // 23 pushes
    'rruUddllUUUUluRRdlddddrruuLUluurDDlDDldRRRuuruLLulDDRurDllDurrDulldldR', // 25 pushes
    'LLDurrdLLrDLdlluuuRRuulDrddrruLdlUUddLruulDlDDuurrdLDlDuruulDrdrddrUUluurrdLLL', // 26 pushes
    'UluRdlldddRluuurrdLDlddrUUUruulDrrruLLdllDDrUluRRdldddlUUruururrddddlLruruuullddldlddrUrruruuulldllDurrurrddddlllUUruRldlluRRurrDullddlddlU', // 28 pushes
    'DDrddlllUdrrUUUUUruLLddrddddlluRdrruuluulldRlDldRdrrruulUUUruLddddrddlUUUUUddllddRdrUUUUluR' // 29 pushes
  ]
} as const;
