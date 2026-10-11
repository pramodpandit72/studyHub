// Auto-generated 100-question RRB TCS Style Full Mock Test Seed Data
export const rrbMockTestData = {
  "title": "RRB — TCS Style Full Mock Test (Electronics Engineering - Diploma)",
  "category": "Railway",
  "description": "Full-length 100-question TCS-style mock test strictly mapped to the Electronics Engineering (Diploma) syllabus. Includes Basic Electronics, Analog, Digital, Microprocessors, Control Systems, Signals, Communication, Instruments, Networks, Electrical, PLC/SCADA, and Quality Management. 90 minutes duration with 1/3 (0.33) negative marking.",
  "durationMinutes": 90,
  "totalMarks": 100,
  "passingPercentage": 40,
  "difficulty": "Medium",
  "hasNegativeMarking": true,
  "negativeMarks": 0.33,
  "marksPerQuestion": 1,
  "optionsCount": 4,
  "questions": [
    {
      "questionText": "A 16-QAM system transmits at a bit rate of 12 Mb/s. The symbol rate is",
      "options": [
        "0.75 Msymbols/s",
        "3 Msymbols/s",
        "6 Msymbols/s",
        "12 Msymbols/s"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "In 16-QAM, each symbol represents log2(16) = 4 bits. Symbol rate = Bit rate / bits per symbol = 12 Mb/s / 4 = 3 Msymbols/s."
    },
    {
      "questionText": "An ideal diode and an ideal capacitor form a clamper that clamps the positive peaks of the input to 0 V. The input is 5 sin ωt volts. The output waveform swings between",
      "options": [
        "−5 V and 0 V",
        "−5 V and +5 V",
        "−10 V and 0 V",
        "0 V and +10 V"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "The input waveform has a peak-to-peak voltage of 10 V (from -5 V to +5 V). With positive peaks clamped to 0 V, the entire waveform is shifted downward by 5 V, swinging between -10 V and 0 V."
    },
    {
      "questionText": "A current i(t) = 3 + 4√2 sin ωt (in amperes) flows through a resistor. Its rms value is",
      "options": [
        "7 A",
        "5 A",
        "6.4 A",
        "3 A"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "The rms value of a combined DC and AC sinusoidal signal is I_rms = √(I_dc² + I_ac,rms²). Here I_dc = 3 A and I_ac,rms = (4√2)/√2 = 4 A. Thus, I_rms = √(3² + 4²) = √(9 + 16) = √25 = 5 A."
    },
    {
      "questionText": "The minimum number of 2-input NAND gates required to implement a 2-input XOR gate is",
      "options": [
        "6",
        "5",
        "3",
        "4"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "A 2-input XOR gate (A ⊕ B) requires a minimum of 4 two-input NAND gates."
    },
    {
      "questionText": "A series RL circuit with R = 10 Ω and L = 0.5 H is connected to a 20 V DC source at t = 0 with zero initial current. The current at t = 50 ms is approximately",
      "options": [
        "0.74 A",
        "2.00 A",
        "0.63 A",
        "1.26 A"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Time constant τ = L/R = 0.5 / 10 = 0.05 s = 50 ms. Maximum steady-state current I_max = V/R = 20 / 10 = 2 A. At t = 50 ms = 1τ, current i(t) = I_max(1 - e^-1) = 2 × (1 - 0.368) = 2 × 0.632 ≈ 1.26 A."
    },
    {
      "questionText": "The characteristic equation of a system is s³ + 2s² + 3s + 10 = 0. The number of roots in the right half of the s-plane is",
      "options": [
        "1",
        "3",
        "2",
        "0"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Constructing Routh array: s³: [1, 3], s²: [2, 10], s¹: [(2×3 - 1×10)/2] = -2, s⁰: [10]. The first column elements are 1, 2, -2, 10. There are two sign changes (from 2 to -2, and from -2 to 10), indicating 2 roots in the right half of the s-plane."
    },
    {
      "questionText": "Two BCD numbers 0100 0111 (47) and 0011 1000 (38) are added using a BCD adder. The correct BCD result is",
      "options": [
        "1000 0111",
        "0111 1111",
        "1000 0101",
        "1001 0101"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "47 + 38 = 85. Lower nibble sum: 0111 + 1000 = 1111 (15 > 9), requiring correction by adding 0110 (6) = 0101 with carry 1. Upper nibble sum: 0100 + 0011 + 1 = 1000 (8). Hence the BCD result is 1000 0101 (85)."
    },
    {
      "questionText": "A dual-slope DVM integrates the input for a fixed time T1 so as to reject 50 Hz power-line interference. Which value of T1 gives the best rejection?",
      "options": [
        "50 ms",
        "25 ms",
        "30 ms",
        "100 ms"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "The period of 50 Hz is T = 1/50 = 20 ms. Rejection of power-line noise occurs when integration time T1 is an integral multiple of 20 ms (k × 20 ms). Among the options, 100 ms is 5 × 20 ms (an exact integer multiple)."
    },
    {
      "questionText": "The eigenvalues of the matrix [[4, 1], [2, 3]] are",
      "options": [
        "3 and 4",
        "−2 and −5",
        "1 and 6",
        "2 and 5"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "det(A - λI) = (4 - λ)(3 - λ) - 2 = λ² - 7λ + 12 - 2 = λ² - 7λ + 10 = (λ - 2)(λ - 5) = 0. The eigenvalues are 2 and 5."
    },
    {
      "questionText": "A source emits four symbols with probabilities 1/2, 1/4, 1/8 and 1/8. The entropy of the source is",
      "options": [
        "1.75 bits/symbol",
        "1.5 bits/symbol",
        "1.25 bits/symbol",
        "2 bits/symbol"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "H = -∑ p_i log2(p_i) = (1/2)(1) + (1/4)(2) + (1/8)(3) + (1/8)(3) = 0.5 + 0.5 + 0.375 + 0.375 = 1.75 bits/symbol."
    },
    {
      "questionText": "A Maxwell inductance–capacitance bridge has the balance equation Lx = R2·R3·C. At balance R2 = 1 kΩ, R3 = 2 kΩ and C = 0.5 μF. The unknown inductance is",
      "options": [
        "1 mH",
        "0.1 H",
        "1 H",
        "10 H"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Lx = R2 × R3 × C = (1000 Ω) × (2000 Ω) × (0.5 × 10^-6 F) = 2 × 10^6 × 0.5 × 10^-6 = 1 H."
    },
    {
      "questionText": "A step-down chopper operates from a 120 V DC supply at 1 kHz with an ON time of 0.3 ms. The average output voltage is",
      "options": [
        "40 V",
        "36 V",
        "84 V",
        "120 V"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Chopping period T = 1/f = 1/1000 = 1 ms. Duty ratio α = Ton / T = 0.3 ms / 1 ms = 0.3. Average output voltage Vo = α × Vs = 0.3 × 120 V = 36 V."
    },
    {
      "questionText": "A 4-bit R-2R ladder DAC gives an output Vo = Vref × N/2ⁿ with Vref = 10 V. For the digital input 1010 the output is",
      "options": [
        "7.5 V",
        "5.0 V",
        "6.25 V",
        "6.67 V"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "For n = 4, 2^n = 16. Digital value 1010 in decimal is 10. Output Vo = 10 V × (10 / 16) = 100 / 16 = 6.25 V."
    },
    {
      "questionText": "In a full adder with A = 1, B = 1 and Cin = 1, the Sum and Carry-out are respectively",
      "options": [
        "1 and 1",
        "0 and 1",
        "0 and 0",
        "1 and 0"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Sum = A ⊕ B ⊕ Cin = 1 ⊕ 1 ⊕ 1 = 1. Carry-out = AB + BCin + ACin = 1·1 + 1·1 + 1·1 = 1. Both Sum and Carry-out are 1."
    },
    {
      "questionText": "In the 8085 microprocessor, the signal used to separate the lower-order address from the multiplexed AD0–AD7 lines is",
      "options": [
        "IO/M",
        "HOLD",
        "RD",
        "ALE"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "ALE (Address Latch Enable) is an active-high output signal that indicates that the bits on AD7–AD0 are address bits. It latches the low-order address into an external latch."
    },
    {
      "questionText": "For an SCR, which relation between the latching current IL and the holding current IH is correct?",
      "options": [
        "IL is always equal to IH",
        "IL is less than IH",
        "IL is always zero",
        "IL is greater than IH (typically 2–3 times)"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Latching current IL is the minimum anode current required to maintain the SCR in the conduction state immediately after gate current is removed. Holding current IH is the minimum anode current required to keep it conducting. IL is typically 2 to 3 times greater than IH."
    },
    {
      "questionText": "The signal x(t) = 10 cos(2000πt) cos(4000πt) is to be sampled. The minimum sampling rate that avoids aliasing is",
      "options": [
        "8 kHz",
        "3 kHz",
        "6 kHz",
        "4 kHz"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "x(t) = 5 [cos(2000πt) + cos(6000πt)]. The frequencies present are f1 = 2000π/(2π) = 1 kHz and f2 = 6000π/(2π) = 3 kHz. Maximum frequency f_max = 3 kHz. Minimum Nyquist rate = 2 × f_max = 2 × 3 kHz = 6 kHz."
    },
    {
      "questionText": "A system has a cache access time of 20 ns, a main memory access time of 200 ns and a hit ratio of 0.9. Assuming main memory is accessed in parallel with the cache lookup (no extra time for lookup on a miss), the average access time is",
      "options": [
        "40 ns",
        "38 ns",
        "110 ns",
        "20 ns"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "With parallel cache and memory access: T_avg = H × T_cache + (1 - H) × T_mem = 0.9 × 20 ns + 0.1 × 200 ns = 18 ns + 20 ns = 38 ns."
    },
    {
      "questionText": "The 8-bit two's complement representation of −37, written in hexadecimal, is",
      "options": [
        "DB",
        "25",
        "DA",
        "A5"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "+37 in binary is 0010 0101. 1's complement is 1101 1010. 2's complement is 1101 1010 + 1 = 1101 1011 = DB in hexadecimal."
    },
    {
      "questionText": "Which of the following components is the most difficult to fabricate on a monolithic integrated circuit chip?",
      "options": [
        "An n-p-n transistor",
        "A small-value resistor",
        "A junction diode",
        "A large-value inductor"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Inductors of large value require substantial magnetic flux loops and physical turns, demanding disproportionate semiconductor silicon area and producing poor Q-factors, making them extremely difficult to fabricate monolithically."
    },
    {
      "questionText": "Elements 10, 20 and 30 are pushed onto an empty stack in that order. The following operations are then performed: pop, push 40, pop, pop. The value returned by the last pop is",
      "options": [
        "40",
        "20",
        "30",
        "10"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Operations trace: Push 10, 20, 30 -> Stack [10, 20, 30]. Pop returns 30 -> Stack [10, 20]. Push 40 -> Stack [10, 20, 40]. Pop returns 40 -> Stack [10, 20]. Pop returns 20. Hence the last pop returns 20."
    },
    {
      "questionText": "A reciprocal two-port network has ABCD parameters A = 3, B = 5 Ω and D = 2. The value of C is",
      "options": [
        "1 S",
        "0.2 S",
        "1.4 S",
        "5 S"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "For a reciprocal two-port network, AD - BC = 1. (3 × 2) - 5C = 1 => 6 - 5C = 1 => 5C = 5 => C = 1 S."
    },
    {
      "questionText": "Above the Curie temperature, a ferromagnetic material",
      "options": [
        "becomes a superconductor",
        "retains its spontaneous magnetisation unchanged",
        "becomes paramagnetic",
        "becomes diamagnetic"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Thermal energy above the Curie temperature disrupts spontaneous domain alignment, causing ferromagnetic materials to transition into paramagnetic materials."
    },
    {
      "questionText": "In an inverting summing amplifier Rf = 10 kΩ, R1 = 5 kΩ and R2 = 10 kΩ. If V1 = 1 V and V2 = 2 V, the output voltage is",
      "options": [
        "−4 V",
        "+4 V",
        "−3 V",
        "−6 V"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Vo = - [ (Rf/R1)V1 + (Rf/R2)V2 ] = - [ (10/5)(1) + (10/10)(2) ] = - [ 2 + 2 ] = -4 V."
    },
    {
      "questionText": "A 2 KB memory chip is mapped starting at address 4000H in an 8085 system. Its last address is",
      "options": [
        "43FFH",
        "47FFH",
        "4FFFH",
        "4800H"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "2 KB = 2048 bytes = 0800H bytes. The range from 4000H ends at 4000H + 0800H - 1 = 47FFH."
    },
    {
      "questionText": "A unity-feedback system has G(s) = 16/[s(s + 2)]. The damping ratio of the closed-loop system is",
      "options": [
        "0.25",
        "4",
        "0.5",
        "0.125"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Closed-loop denominator is s² + 2s + 16 = s² + 2ζωn s + ωn². Here ωn = 4 rad/s, and 2ζ(4) = 2 => ζ = 2/8 = 0.25."
    },
    {
      "questionText": "An n-type silicon sample at 300 K is doped with donors of 10¹⁶ cm⁻³. If the intrinsic carrier concentration is 1.5 × 10¹⁰ cm⁻³, the equilibrium hole concentration is approximately",
      "options": [
        "2.25 × 10⁶ cm⁻³",
        "1.5 × 10⁴ cm⁻³",
        "1.5 × 10¹⁰ cm⁻³",
        "2.25 × 10⁴ cm⁻³"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "From law of mass action, n·p = ni². With n ≈ Nd = 10¹⁶ cm⁻³, p = ni²/Nd = (1.5 × 10¹⁰)² / 10¹⁶ = 2.25 × 10²⁰ / 10¹⁶ = 2.25 × 10⁴ cm⁻³."
    },
    {
      "questionText": "If x(t) has the Fourier transform X(ω), then the Fourier transform of x(t − t₀) is",
      "options": [
        "X(ω − t₀)",
        "t₀·X(ω)",
        "X(ω)·e^(−jωt₀)",
        "X(ω)·e^(+jωt₀)"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "By the time shifting property of the Fourier transform: F{x(t - t0)} = X(ω) e^(-jωt0)."
    },
    {
      "questionText": "Which of the following semiconductor memories is volatile and needs periodic refreshing?",
      "options": [
        "DRAM",
        "EPROM",
        "Flash memory",
        "SRAM"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Dynamic RAM (DRAM) stores data bits as charge across capacitors which leak over time, requiring periodic refresh cycles and constant power."
    },
    {
      "questionText": "A uniform plane wave travels in a lossless non-magnetic dielectric with εr = 9. The intrinsic impedance of the medium is approximately",
      "options": [
        "125.7 Ω",
        "1131 Ω",
        "377 Ω",
        "41.9 Ω"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Intrinsic impedance η = η0 / √(εr) = 377 / √9 = 377 / 3 ≈ 125.7 Ω."
    },
    {
      "questionText": "A geostationary satellite is at an altitude of about 35,786 km directly above an earth station. The approximate time for a signal to travel from the station up to the satellite and back down to the same station is",
      "options": [
        "0.36 s",
        "0.24 s",
        "0.48 s",
        "0.12 s"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Total round trip distance d = 2 × 35,786 km = 71,572 km. Time t = d / c = 71,572 / 300,000 ≈ 0.2386 s ≈ 0.24 s."
    },
    {
      "questionText": "A series RLC circuit has R = 20 Ω, L = 2 mH and C = 0.5 μF. The quality factor at resonance is approximately",
      "options": [
        "10",
        "6.32",
        "0.316",
        "3.16"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Q = (1/R)√(L/C) = (1/20)√((2 × 10^-3) / (0.5 × 10^-6)) = (1/20)√(4000) = (1/20) × 63.245 ≈ 3.16."
    },
    {
      "questionText": "A 100 MHz carrier is frequency modulated by a 5 kHz tone producing a peak deviation of 25 kHz. Using Carson's rule, the bandwidth is",
      "options": [
        "10 kHz",
        "60 kHz",
        "30 kHz",
        "50 kHz"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "By Carson's rule: BW = 2(Δf + fm) = 2(25 kHz + 5 kHz) = 2 × 30 kHz = 60 kHz."
    },
    {
      "questionText": "In a statistical process control chart, the upper and lower control limits are conventionally set at",
      "options": [
        "the mean ± 2 standard deviations",
        "the mean ± 1 standard deviation",
        "the mean ± 3 standard deviations",
        "the mean ± 6 standard deviations"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Standard Shewhart control charts use 3-sigma control limits: μ ± 3σ, covering 99.73% of normal process variation."
    },
    {
      "questionText": "In a Q-meter, a 10 mV signal is injected into the resonant circuit and the voltage across the tuning capacitor at resonance is 1.2 V. The Q of the coil is",
      "options": [
        "0.0083",
        "1200",
        "120",
        "12"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Q = Vc / Vin = 1.2 V / 10 mV = 1.2 / 0.01 = 120."
    },
    {
      "questionText": "The 8085 executes MVI A, 8FH followed by ADI 72H. After execution the accumulator and the carry flag are",
      "options": [
        "A = 01H, CY = 1",
        "A = 0FH, CY = 1",
        "A = FDH, CY = 0",
        "A = 01H, CY = 0"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "8FH + 72H = 101H. The accumulator stores lower 8 bits (01H) and the carry flag CY is set to 1."
    },
    {
      "questionText": "A unity-feedback system has the open-loop transfer function K(s + 1)/[s(s + 2)(s + 4)]. The centroid of the root-locus asymptotes is",
      "options": [
        "−3.5",
        "−2",
        "−3",
        "−2.5"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Poles at 0, -2, -4 (sum = -6). Zero at -1 (sum = -1). Centroid σ = (∑poles - ∑zeros)/(P - Z) = (-6 - (-1)) / (3 - 1) = -5 / 2 = -2.5."
    },
    {
      "questionText": "Which of the following is a voltage-controlled power semiconductor device?",
      "options": [
        "IGBT",
        "Power BJT",
        "GTO",
        "SCR"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "The IGBT (Insulated Gate Bipolar Transistor) is controlled by gate voltage, whereas BJT, SCR, and GTO require gate/base currents."
    },
    {
      "questionText": "lim (x→0) (1 − cos x)/x² equals",
      "options": [
        "1/2",
        "2",
        "1",
        "0"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "1 - cos x = 2 sin²(x/2). lim(x->0) [2 sin²(x/2) / x²] = 2 × (1/4) = 1/2."
    },
    {
      "questionText": "A PMMC movement has full-scale current 50 μA and internal resistance 1 kΩ. The series resistance needed to convert it into a 0–100 V voltmeter is",
      "options": [
        "2.000 MΩ",
        "1.99 MΩ",
        "2.001 MΩ",
        "1.999 MΩ"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Total circuit resistance R = V / Im = 100 / (50 × 10^-6) = 2,000,000 Ω = 2000 kΩ. Multiplier resistance Rs = R - Rm = 2000 kΩ - 1 kΩ = 1999 kΩ = 1.999 MΩ."
    },
    {
      "questionText": "The vector (restart) address of the RST 6.5 interrupt of the 8085 is",
      "options": [
        "0034H",
        "0024H",
        "003CH",
        "002CH"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Vector address = 6.5 × 8 = 52 decimal. Converting 52 to hex gives 0034H (since 3 × 16 + 4 = 52)."
    },
    {
      "questionText": "In a PLC ladder diagram, two normally-open contacts connected in parallel and driving an output coil implement",
      "options": [
        "NAND logic",
        "AND logic",
        "OR logic",
        "XOR logic"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Parallel contacts in ladder logic implement OR logic, as closing either contact provides a continuous path to energize the output coil."
    },
    {
      "questionText": "A straight conductor 0.4 m long carries 10 A in a uniform magnetic field of 0.5 T. The conductor makes an angle of 30° with the field. The force on it is",
      "options": [
        "0.5 N",
        "1.73 N",
        "1 N",
        "2 N"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "F = B·I·L·sin(θ) = 0.5 T × 10 A × 0.4 m × sin(30°) = 2 × 0.5 = 1 N."
    },
    {
      "questionText": "A 50 Ω lossless transmission line is terminated in a 100 Ω load. The VSWR on the line is",
      "options": [
        "3",
        "0.33",
        "1.5",
        "2"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Reflection coefficient Γ = (100 - 50)/(100 + 50) = 50/150 = 1/3. VSWR = (1 + 1/3) / (1 - 1/3) = (4/3) / (2/3) = 2."
    },
    {
      "questionText": "A centre-tapped full-wave rectifier uses ideal diodes. Each half of the transformer secondary gives 20 V rms. The peak inverse voltage across each diode is approximately",
      "options": [
        "56.6 V",
        "28.3 V",
        "20 V",
        "40 V"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Peak secondary voltage Vm = 20√2 ≈ 28.28 V. In centre-tapped full wave rectifiers, PIV = 2 Vm = 2 × 28.28 V ≈ 56.6 V."
    },
    {
      "questionText": "A rectangular air-filled waveguide has broad dimension a = 4 cm. The cut-off frequency of the dominant TE10 mode is",
      "options": [
        "1.875 GHz",
        "5 GHz",
        "7.5 GHz",
        "3.75 GHz"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "For TE10 mode: fc = c / (2a) = (3 × 10^10 cm/s) / (2 × 4 cm) = 3 × 10^10 / 8 = 3.75 × 10^9 Hz = 3.75 GHz."
    },
    {
      "questionText": "A standard second-order system has ζ = 0.5 and ωn = 8 rad/s. Using the 2% criterion, the settling time is approximately",
      "options": [
        "2 s",
        "1 s",
        "0.25 s",
        "0.5 s"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Settling time (2% criterion) Ts = 4 / (ζ·ωn) = 4 / (0.5 × 8) = 4 / 4 = 1 s."
    },
    {
      "questionText": "In a CE amplifier the base–collector capacitance is 4 pF and the mid-band voltage gain is −50. The Miller-equivalent capacitance at the input due to this capacitor is",
      "options": [
        "196 pF",
        "204 pF",
        "4 pF",
        "200 pF"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Miller input capacitance Cin = Cbc × (1 - Av) = 4 pF × (1 - (-50)) = 4 pF × 51 = 204 pF."
    },
    {
      "questionText": "A CRO displays a sine wave occupying 6 vertical divisions peak-to-peak at 2 V/div through a ×10 probe (the 2 V/div setting refers to the CRO input). The rms value of the actual signal is approximately",
      "options": [
        "4.24 V",
        "21.2 V",
        "42.4 V",
        "84.8 V"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "CRO display gives Vpp = 6 div × 2 V/div = 12 V. Actual signal Vpp = 12 V × 10 = 120 Vpp. Peak Vm = 60 V. Vrms = 60 / √2 ≈ 42.4 V."
    },
    {
      "questionText": "Which of the following statements about an LED and a photodiode is correct?",
      "options": [
        "An LED works on the photoconductive effect and a photodiode works on electroluminescence",
        "An LED emits light by radiative recombination when forward biased, while a photodiode produces photocurrent when illuminated, usually under reverse bias",
        "Both devices are normally operated in forward bias, one to emit and the other to detect light",
        "A photodiode produces light output proportional to its forward current"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "An LED produces light via radiative recombination of electron-hole pairs under forward bias. A photodiode absorbs incident photons to produce electron-hole pairs and photocurrent under reverse bias."
    },
    {
      "questionText": "The expression F = A'B + AB' + AB simplifies to",
      "options": [
        "A'B'",
        "A ⊕ B",
        "AB",
        "A + B"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "F = A'B + AB' + AB = B(A' + A) + AB' = B + AB' = A + B."
    },
    {
      "questionText": "In a two-wattmeter measurement of a balanced three-phase load, the readings are 1000 W and 500 W (both positive). The power factor of the load is",
      "options": [
        "0.8 lagging",
        "0.5 lagging",
        "0.707 lagging",
        "0.866 lagging"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "tan(φ) = √3(W1 - W2)/(W1 + W2) = √3(500)/1500 = 1/√3. φ = 30°. Power factor = cos(30°) = √3/2 ≈ 0.866."
    },
    {
      "questionText": "A strain gauge of resistance 120 Ω and gauge factor 2.0 is subjected to a strain of 1000 microstrain. The change in resistance is",
      "options": [
        "0.12 Ω",
        "2.4 Ω",
        "0.024 Ω",
        "0.24 Ω"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "ΔR = Gf × R × ε = 2.0 × 120 Ω × (1000 × 10^-6) = 240 × 10^-3 = 0.24 Ω."
    },
    {
      "questionText": "In an 8086, CS = 2000H and IP = 0150H. The physical address of the next instruction is",
      "options": [
        "20150H",
        "03500H",
        "2150H",
        "20015H"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Physical Address = (CS × 16) + IP = 20000H + 0150H = 20150H."
    },
    {
      "questionText": "The maximum theoretical efficiency of a series-fed class A power amplifier with resistive load is",
      "options": [
        "50%",
        "25%",
        "12.5%",
        "78.5%"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "A direct-coupled (series-fed) class A power amplifier with resistive load achieves a maximum theoretical efficiency of 25%."
    },
    {
      "questionText": "A JFET common-source amplifier has gm = 3 mS, RD = 10 kΩ and a capacitor-coupled load RL = 10 kΩ (rd is very large). The voltage gain is",
      "options": [
        "−30",
        "−1.5",
        "−7.5",
        "−15"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Effective ac drain resistance rac = RD || RL = 10 kΩ || 10 kΩ = 5 kΩ. Voltage gain Av = -gm × rac = -3 mS × 5 kΩ = -15."
    },
    {
      "questionText": "In the 625-line, 25-frame/s television system, the horizontal line frequency is",
      "options": [
        "15,750 Hz",
        "12,500 Hz",
        "31,250 Hz",
        "15,625 Hz"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Line frequency fH = Number of lines × Frame rate = 625 × 25 = 15,625 Hz."
    },
    {
      "questionText": "Which of the following is NOT a necessary condition for deadlock in an operating system?",
      "options": [
        "Hold and wait",
        "Pre-emption (resources can be forcibly taken back from a process)",
        "Mutual exclusion",
        "Circular wait"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "The four necessary conditions are Mutual Exclusion, Hold and Wait, No Pre-emption, and Circular Wait. 'Pre-emption' prevents deadlock, whereas 'No Pre-emption' is the necessary condition."
    },
    {
      "questionText": "At the phase-crossover frequency of a stable system, |G(jω)H(jω)| = 0.25. The gain margin is approximately",
      "options": [
        "−12 dB",
        "6 dB",
        "12 dB",
        "4 dB"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Gain margin GM = 1 / |G(jω)H(jω)| = 1 / 0.25 = 4. In decibels, GM = 20 log10(4) ≈ 12 dB."
    },
    {
      "questionText": "The minimum number of 2:1 multiplexers required to build an 8:1 multiplexer is",
      "options": [
        "6",
        "4",
        "8",
        "7"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Level 1 requires 4 MUXes, Level 2 requires 2 MUXes, Level 3 requires 1 MUX. Total = 4 + 2 + 1 = 7 MUXes."
    },
    {
      "questionText": "Two identical cells, each of emf 1.5 V and internal resistance 0.5 Ω, are connected in series across a 2 Ω load. The load current is",
      "options": [
        "0.6 A",
        "1.2 A",
        "1 A",
        "0.67 A"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Total EMF = 1.5 + 1.5 = 3 V. Total internal resistance = 0.5 + 0.5 = 1 Ω. Total loop resistance = 1 + 2 = 3 Ω. Current I = 3 V / 3 Ω = 1 A."
    },
    {
      "questionText": "A 12 V Zener diode regulator is fed from 20 V through a 200 Ω series resistor and supplies a 600 Ω load. The Zener current is",
      "options": [
        "40 mA",
        "20 mA",
        "30 mA",
        "60 mA"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Series current Is = (20 - 12)/200 = 8/200 = 40 mA. Load current IL = 12/600 = 20 mA. Zener current Iz = Is - IL = 40 - 20 = 20 mA."
    },
    {
      "questionText": "The solution of dy/dx + 2y = 0 with y(0) = 3 gives y(ln 2) =",
      "options": [
        "1.0",
        "0.375",
        "0.75",
        "1.5"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "dy/dx = -2y => y(x) = C e^(-2x). Given y(0) = 3 => y(x) = 3 e^(-2x). At x = ln 2: y = 3 e^(-2 ln 2) = 3 e^(ln(2^-2)) = 3 / 4 = 0.75."
    },
    {
      "questionText": "A 12 Ω resistor is connected in parallel with a series combination of 4 Ω and 8 Ω. This combination is then placed in series with a 4 Ω resistor. The equivalent resistance is",
      "options": [
        "28 Ω",
        "10 Ω",
        "16 Ω",
        "6 Ω"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "4 Ω + 8 Ω = 12 Ω. 12 Ω in parallel with 12 Ω = 6 Ω. Total Req = 6 Ω + 4 Ω = 10 Ω."
    },
    {
      "questionText": "The Meissner effect refers to",
      "options": [
        "loss of resistance in a semiconductor at high temperature",
        "increase of conductivity of a metal with temperature",
        "magnetisation of a ferrite under an AC field",
        "expulsion of magnetic flux from the interior of a superconductor below its critical temperature"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "The Meissner effect is the complete expulsion of magnetic flux lines from the interior of a material as it transitions into the superconducting state below its critical temperature."
    },
    {
      "questionText": "The envelope of an AM wave has a maximum amplitude of 12 V and a minimum amplitude of 4 V. The modulation index is",
      "options": [
        "0.67",
        "0.25",
        "0.33",
        "0.5"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Modulation index m = (Vmax - Vmin) / (Vmax + Vmin) = (12 - 4) / (12 + 4) = 8 / 16 = 0.5."
    },
    {
      "questionText": "A 4-pole, 50 Hz induction motor runs at a slip of 4%. The frequency of the rotor currents is",
      "options": [
        "50 Hz",
        "48 Hz",
        "2 Hz",
        "4 Hz"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Rotor frequency fr = s × f = 0.04 × 50 Hz = 2 Hz."
    },
    {
      "questionText": "In a DC shunt motor, if the field flux is reduced by 10% while the back emf remains essentially unchanged, the speed will",
      "options": [
        "decrease by 10%",
        "remain unchanged",
        "increase by about 11.1%",
        "increase by 10%"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Speed N ∝ Eb / Φ. New speed N' = N / 0.9 = 1.111 N, representing an increase of approximately 11.1%."
    },
    {
      "questionText": "A single-phase half-wave controlled rectifier with resistive load is fed from a 230 V rms supply with a firing angle of 60°. The average output voltage is approximately",
      "options": [
        "77.7 V",
        "155.3 V",
        "103.5 V",
        "51.8 V"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Vo = (Vm / 2π) (1 + cos α). Vm = 230√2 ≈ 325.27 V. With α = 60°: cos 60° = 0.5 => 1 + cos 60° = 1.5. Vo = (325.27 × 1.5) / (2π) ≈ 77.65 V ≈ 77.7 V."
    },
    {
      "questionText": "In a PCM system using 10-bit uniform quantisation, the maximum signal-to-quantisation-noise ratio for a full-scale sine wave is approximately",
      "options": [
        "74 dB",
        "48 dB",
        "62 dB",
        "60 dB"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "SQNR = (6.02 × n + 1.76) dB = 6.02 × 10 + 1.76 = 61.96 dB ≈ 62 dB."
    },
    {
      "questionText": "A step-index fibre has core radius 4 μm, numerical aperture 0.12 and operates at λ = 1.3 μm. Using V = 2πa·NA/λ, the V-number and the mode behaviour are",
      "options": [
        "V ≈ 0.37, single-mode",
        "V ≈ 2.32, single-mode",
        "V ≈ 14.6, multimode",
        "V ≈ 2.32, multimode"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "V = 2π(4 μm)(0.12) / 1.3 μm = 3.016 / 1.3 ≈ 2.32. For step-index fibre, single-mode condition is V < 2.405. Since 2.32 < 2.405, it operates in single mode."
    },
    {
      "questionText": "A first-order RC low-pass filter has R = 2 kΩ and C = 0.1 μF. Its cut-off (−3 dB) frequency is approximately",
      "options": [
        "5000 Hz",
        "1.59 kHz",
        "796 Hz",
        "7.96 kHz"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "fc = 1 / (2πRC) = 1 / (2π × 2000 × 0.1 × 10^-6) = 1 / (4π × 10^-4) ≈ 795.8 Hz ≈ 796 Hz."
    },
    {
      "questionText": "An n-channel JFET has IDSS = 8 mA and VP = −4 V. At VGS = −1 V (saturation region) the drain current is",
      "options": [
        "0.5 mA",
        "2 mA",
        "6 mA",
        "4.5 mA"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "ID = IDSS [1 - VGS/VP]² = 8 mA × [1 - (-1 / -4)]² = 8 mA × (0.75)² = 8 × 0.5625 = 4.5 mA."
    },
    {
      "questionText": "x[n] = {1, 2, 3} (starting at n = 0) is convolved with h[n] = {1, 1} (starting at n = 0). The output y[n] is",
      "options": [
        "{1, 3, 5, 3}",
        "{1, 2, 3, 3}",
        "{1, 3, 6, 3}",
        "{1, 3, 5}"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Convolution y[0] = 1·1 = 1; y[1] = 1·1 + 2·1 = 3; y[2] = 2·1 + 3·1 = 5; y[3] = 3·1 = 3. Output is {1, 3, 5, 3}."
    },
    {
      "questionText": "An amplifier has an open-loop gain of 100. A negative feedback network with β = 0.04 is applied. The closed-loop gain is",
      "options": [
        "20",
        "25",
        "4",
        "33.3"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Af = A / (1 + Aβ) = 100 / (1 + 100 × 0.04) = 100 / (1 + 4) = 100 / 5 = 20."
    },
    {
      "questionText": "Which of the following microwave tubes is a crossed-field device?",
      "options": [
        "Reflex klystron",
        "Magnetron",
        "Travelling-wave tube",
        "Two-cavity klystron"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "The cavity magnetron is an M-type crossed-field device where static magnetic field and DC electric field are mutually perpendicular."
    },
    {
      "questionText": "A logic family has VOH(min) = 2.7 V, VIH(min) = 2.0 V, VOL(max) = 0.5 V and VIL(max) = 0.8 V. Its worst-case noise margin is",
      "options": [
        "0.3 V",
        "0.7 V",
        "0.5 V",
        "1.2 V"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "NMH = VOH - VIH = 2.7 - 2.0 = 0.7 V. NML = VIL - VOL = 0.8 - 0.5 = 0.3 V. Worst-case noise margin = min(0.7, 0.3) = 0.3 V."
    },
    {
      "questionText": "The fundamental period of x(t) = cos(10πt) + sin(15πt) is",
      "options": [
        "0.2 s",
        "0.8 s",
        "0.133 s",
        "0.4 s"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "T1 = 2π / 10π = 1/5 s. T2 = 2π / 15π = 2/15 s. Fundamental period T = LCM(1/5, 2/15) = 2/5 s = 0.4 s."
    },
    {
      "questionText": "A signal has the Laplace transform X(s) = (3s + 6)/[s(s + 4)]. The final value of x(t) is",
      "options": [
        "0",
        "1.5",
        "3",
        "0.75"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Using Final Value Theorem: lim(t->∞) x(t) = lim(s->0) s·X(s) = lim(s->0) (3s + 6)/(s + 4) = 6/4 = 1.5."
    },
    {
      "questionText": "A unity-feedback system has G(s) = 10/[s(s + 5)]. For the input r(t) = 2t, the steady-state error is",
      "options": [
        "1",
        "0",
        "2",
        "0.5"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Velocity error constant Kv = lim(s->0) s G(s) = 10/5 = 2. Steady-state error for ramp r(t) = 2t (slope A = 2) is ess = A / Kv = 2 / 2 = 1."
    },
    {
      "questionText": "Two fair dice are thrown. Given that at least one die shows 4, the probability that the sum is 8 is",
      "options": [
        "1/12",
        "1/6",
        "1/11",
        "5/36"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "There are 11 outcomes where at least one die is 4: (4,1),(4,2),(4,3),(4,4),(4,5),(4,6), (1,4),(2,4),(3,4),(5,4),(6,4). Out of these, only (4,4) has a sum of 8. Probability = 1/11."
    },
    {
      "questionText": "A block code has minimum Hamming distance dmin = 5. Which statement is correct?",
      "options": [
        "It can detect up to 4 errors and correct up to 3 errors",
        "It can detect up to 4 errors and correct up to 2 errors",
        "It can detect up to 5 errors and correct up to 2 errors",
        "It can detect up to 2 errors and correct up to 4 errors"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Detection capability td = dmin - 1 = 5 - 1 = 4 errors. Correction capability tc = ⌊(dmin - 1)/2⌋ = ⌊4/2⌋ = 2 errors."
    },
    {
      "questionText": "The function F(A, B, C, D) = Σm(0, 2, 8, 10) minimises to",
      "options": [
        "B'D",
        "B'D'",
        "A'C'",
        "BD"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Minterms 0(0000), 2(0010), 8(1000), 10(1010) form the 4 corner cells of a 4-variable K-map where B=0 and D=0, simplifying to B'D'."
    },
    {
      "questionText": "The race-around condition in a level-triggered JK flip-flop occurs when",
      "options": [
        "J = 1, K = 0 and the clock is on a falling edge",
        "J = K = 0 and the clock is low",
        "J = K = 1 and the clock pulse width is longer than the propagation delay of the flip-flop",
        "J ≠ K and the flip-flop is edge triggered"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "In a level-triggered JK flip-flop with J=K=1 (toggle mode), if the clock pulse width exceeds the internal propagation delay of the gates, the output toggles multiple times uncontrollably during the high level."
    },
    {
      "questionText": "A half-wave dipole is to be designed for 150 MHz in free space. Neglecting end effects, its length is",
      "options": [
        "0.5 m",
        "1.5 m",
        "1 m",
        "2 m"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Wavelength λ = c / f = (3 × 10^8 m/s) / (150 × 10^6 Hz) = 2 m. Length of half-wave dipole = λ / 2 = 2 / 2 = 1 m."
    },
    {
      "questionText": "A Wien-bridge oscillator uses equal resistors R = 15.9 kΩ and equal capacitors C = 10 nF in its frequency-determining network. The oscillation frequency and the minimum amplifier gain required are approximately",
      "options": [
        "100 Hz and 3",
        "1 kHz and 3",
        "6.29 kHz and 3",
        "1 kHz and 29"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "fo = 1 / (2πRC) = 1 / (2π × 15.9 × 10^3 × 10 × 10^-9) ≈ 1000 Hz = 1 kHz. Minimum amplifier gain to compensate lead-lag network attenuation (1/3) is Av = 3."
    },
    {
      "questionText": "A 555 timer astable multivibrator uses RA = 10 kΩ, RB = 20 kΩ and C = 10 nF. The output frequency is approximately",
      "options": [
        "2.88 kHz",
        "5.76 kHz",
        "4.80 kHz",
        "1.44 kHz"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "f = 1.44 / [(RA + 2RB)·C] = 1.44 / [(10 kΩ + 40 kΩ) × 10 nF] = 1.44 / (50000 × 10^-8) = 1.44 / (5 × 10^-4) = 2880 Hz ≈ 2.88 kHz."
    },
    {
      "questionText": "A voltmeter with a full-scale reading of 150 V has a guaranteed accuracy of ±1% of full-scale value. When it reads 60 V, the limiting error in that reading is",
      "options": [
        "±0.4%",
        "±2.5%",
        "±1%",
        "±1.5%"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Limiting error = 1% of 150 V = 1.5 V. Percentage limiting error at 60 V = (1.5 / 60) × 100% = 2.5%."
    },
    {
      "questionText": "A transformer has a constant (iron) loss of 400 W and a full-load copper loss of 900 W. The efficiency is maximum at what fraction of the full load?",
      "options": [
        "Full load",
        "4/9 of full load",
        "3/4 of full load",
        "2/3 of full load"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Fraction x = √(Pi / Pcu) = √(400 / 900) = √(4/9) = 2/3 of full load."
    },
    {
      "questionText": "A CE amplifier is biased at IE = 2.6 mA (thermal voltage VT = 26 mV). Its emitter is fully bypassed and the effective ac collector load is 2 kΩ. Treating IC ≈ IE, the magnitude of the voltage gain is approximately",
      "options": [
        "77",
        "20",
        "2000",
        "200"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Dynamic emitter resistance re = VT / IE = 26 mV / 2.6 mA = 10 Ω. Voltage gain |Av| = Rc / re = 2000 Ω / 10 Ω = 200."
    },
    {
      "questionText": "A superheterodyne receiver with IF = 455 kHz is tuned to 1000 kHz using high-side local oscillator injection. The image frequency is",
      "options": [
        "1455 kHz",
        "545 kHz",
        "1910 kHz",
        "2365 kHz"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "f_img = fs + 2 f_IF = 1000 kHz + 2(455 kHz) = 1000 + 910 = 1910 kHz."
    },
    {
      "questionText": "Which statement about a common-collector (emitter-follower) amplifier is correct?",
      "options": [
        "Voltage gain is much greater than unity with a 180° phase shift",
        "Voltage gain is slightly less than unity, with high input resistance and low output resistance",
        "Current gain is less than unity",
        "Voltage gain is unity with low input resistance and high output resistance"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Common-collector configuration features voltage gain slightly less than unity (Av ≈ 1), high input resistance, low output resistance, and zero phase shift, serving as an impedance-matching buffer."
    },
    {
      "questionText": "An op-amp has a differential gain of 2000 and a CMRR of 80 dB. For a differential input of 1 mV and a common-mode input of 500 mV, the output voltage is",
      "options": [
        "2.1 V",
        "2.0 V",
        "14.5 V",
        "1.9 V"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "CMRR = 80 dB = 10^4. Acm = Ad / CMRR = 2000 / 10000 = 0.2. Vo = Ad·Vd + Acm·Vcm = 2000 × (1 mV) + 0.2 × (500 mV) = 2.0 V + 0.1 V = 2.1 V."
    },
    {
      "questionText": "A 12 V source feeds a 6 Ω series resistor, followed by a 3 Ω resistor connected across the output terminals A–B. A 6 Ω load is now connected across A–B. The load current is",
      "options": [
        "0.67 A",
        "1.0 A",
        "0.5 A",
        "1.5 A"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Vth = 12 × (3 / (6 + 3)) = 4 V. Rth = 6 || 3 = 2 Ω. Load current IL = Vth / (Rth + RL) = 4 / (2 + 6) = 4 / 8 = 0.5 A."
    },
    {
      "questionText": "Two amplifier stages are cascaded. Stage 1 has a gain of 10 dB and a noise figure of 3 dB; stage 2 has a noise figure of 10 dB. The overall noise figure is approximately",
      "options": [
        "4.6 dB",
        "3.9 dB",
        "6.5 dB",
        "13 dB"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "In linear terms: F1 = 10^(3/10) ≈ 1.995, G1 = 10^(10/10) = 10, F2 = 10^(10/10) = 10. Friis formula: F = F1 + (F2 - 1)/G1 = 1.995 + (10 - 1)/10 = 1.995 + 0.9 = 2.895. In dB: 10 log10(2.895) ≈ 4.6 dB."
    },
    {
      "questionText": "A 4-bit Johnson (twisted-ring) counter, in which the inverted output of the last flip-flop is fed back to the first and the bits shift one place to the right per clock, starts at 0000. Its state after 5 clock pulses is",
      "options": [
        "0111",
        "1111",
        "1110",
        "0011"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Clock states shifting right with MSB = NOT(LSB): Start: 0000 -> CLK1: 1000 -> CLK2: 1100 -> CLK3: 1110 -> CLK4: 1111 -> CLK5: 0111."
    },
    {
      "questionText": "At the boundary between two perfect dielectrics with no free surface charge, which condition is correct?",
      "options": [
        "The normal component of D is continuous",
        "The normal component of E is continuous",
        "The tangential component of E is discontinuous",
        "The tangential component of D is continuous"
      ],
      "correctOptionIndex": 0,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "By Gauss's law boundary condition, when there is no free surface charge (ρs = 0), the normal component of displacement flux density D is continuous (Dn1 = Dn2)."
    },
    {
      "questionText": "A transistor in the active region has α = 0.98 and an emitter current of 5 mA. The base current is",
      "options": [
        "0.02 mA",
        "4.9 mA",
        "0.5 mA",
        "0.1 mA"
      ],
      "correctOptionIndex": 3,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "IB = (1 - α) IE = (1 - 0.98) × 5 mA = 0.02 × 5 mA = 0.1 mA."
    },
    {
      "questionText": "A group of subscribers originates 100 calls per hour with an average holding time of 3 minutes. The offered traffic is",
      "options": [
        "50 Erlangs",
        "5 Erlangs",
        "0.5 Erlang",
        "300 Erlangs"
      ],
      "correctOptionIndex": 1,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Offered traffic A = λ × H = 100 calls/hour × (3 / 60) hours = 100 × 0.05 = 5 Erlangs."
    },
    {
      "questionText": "A connected network graph has 5 nodes and 9 branches. The number of independent loop (KVL) equations is",
      "options": [
        "4",
        "3",
        "5",
        "9"
      ],
      "correctOptionIndex": 2,
      "marks": 1,
      "negativeMarks": 0.33,
      "explanation": "Number of independent loop equations l = b - n + 1 = 9 - 5 + 1 = 5."
    }
  ]
};
