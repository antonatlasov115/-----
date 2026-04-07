import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './useGameStore';
import { ChipType, GameMode, GamePhase } from '../types';

/**
 * PRESERVATION PROPERTY TESTS
 * 
 * Property 2: Preservation - Local Move Behavior
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests observe behavior on UNFIXED code for non-buggy inputs
 * (local moves, AI moves, hotseat moves) and ensure that behavior is preserved after the fix.
 * 
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline behavior)
 * and continue to PASS after fix (confirms no regressions)
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

describe('Preservation Tests - Local Move Behavior', () => {
  beforeEach(() => {
    useGameStore.getState().initializeGame();
  });

  describe('Test 1: Local moves in single player mode continue to animate correctly', () => {
    it('should update chip position and create new object reference for local player move', () => {
      // Arrange: Single player mode, player is RUNNER
      useGameStore.getState().setGameMode(GameMode.SINGLE_PLAYER);
      useGameStore.getState().setPlayerRole(ChipType.RUNNER);
      
      // Set phase to RUNNER_TURN
      useGameStore.setState({ phase: GamePhase.RUNNER_TURN });

      const state = useGameStore.getState();
      const initialChip = state.chips.find((c) => c.id === 'runner-0');
      expect(initialChip).toBeDefined();
      
      const initialChipReference = initialChip!;
      const initialPositionReference = initialChip!.position;

      // Act: Select chip and move it
      state.selectChip('runner-0');
      
      // Move phantom chip to valid position (40px away)
      const targetPosition = { x: 140, y: 780 };
      useGameStore.setState({
        phantomChip: {
          id: 'phantom-runner-0',
          type: ChipType.RUNNER,
          position: targetPosition,
          radius: initialChip!.radius,
          sourceChipId: 'runner-0',
        },
      });
      
      state.confirmMove();

      // Assert: Chip should be updated with new references
      const updatedState = useGameStore.getState();
      const updatedChip = updatedState.chips.find((c) => c.id === 'runner-0');

      expect(updatedChip).toBeDefined();
      
      // PRESERVATION: Local moves create new chip object references
      expect(updatedChip).not.toBe(initialChipReference);
      
      // PRESERVATION: Position object is also new reference
      expect(updatedChip!.position).not.toBe(initialPositionReference);
      
      // Position values should be updated
      expect(updatedChip!.position.x).toBe(140);
      expect(updatedChip!.position.y).toBe(780);
    });

    it('should handle multiple sequential local moves correctly across turns', () => {
      // Arrange: Single player mode
      useGameStore.getState().setGameMode(GameMode.SINGLE_PLAYER);
      useGameStore.getState().setPlayerRole(ChipType.RUNNER);
      useGameStore.setState({ phase: GamePhase.RUNNER_TURN });

      const chipReferences: any[] = [];
      const positionReferences: any[] = [];

      // Store initial references
      const initialChip = useGameStore.getState().chips.find((c) => c.id === 'runner-1');
      chipReferences.push(initialChip);
      positionReferences.push(initialChip!.position);

      // Act: Make 3 sequential moves across different turns
      // Each runner can only move once per turn, so we need to complete turns
      const moves = [
        { x: 240, y: 780 },  // 40px right from (200, 780)
        { x: 240, y: 740 },  // 40px up
        { x: 200, y: 740 },  // 40px left
      ];

      moves.forEach((targetPosition, index) => {
        const state = useGameStore.getState();
        
        // Reset movedChipsThisTurn to allow runner-1 to move again
        useGameStore.setState({ 
          movedChipsThisTurn: [],
          phase: GamePhase.RUNNER_TURN,
        });
        
        const currentChip = state.chips.find((c) => c.id === 'runner-1');
        
        state.selectChip('runner-1');
        
        useGameStore.setState({
          phantomChip: {
            id: 'phantom-runner-1',
            type: ChipType.RUNNER,
            position: targetPosition,
            radius: currentChip!.radius,
            sourceChipId: 'runner-1',
          },
        });
        
        state.confirmMove();

        // Store references after each move
        const updatedChip = useGameStore.getState().chips.find((c) => c.id === 'runner-1');
        chipReferences.push(updatedChip);
        positionReferences.push(updatedChip!.position);
      });

      // Assert: All references should be different (new objects created each time)
      for (let i = 0; i < chipReferences.length - 1; i++) {
        for (let j = i + 1; j < chipReferences.length; j++) {
          expect(chipReferences[i]).not.toBe(chipReferences[j]);
          expect(positionReferences[i]).not.toBe(positionReferences[j]);
        }
      }

      // Final position should match last move
      const finalChip = chipReferences[chipReferences.length - 1];
      expect(finalChip.position.x).toBe(200);
      expect(finalChip.position.y).toBe(740);
    });
  });

  describe('Test 2: AI moves continue to animate correctly', () => {
    it('should update chip position and create new object reference for AI chaser move', () => {
      // Arrange: Single player mode, player is RUNNER (so AI plays CHASER)
      useGameStore.getState().setGameMode(GameMode.SINGLE_PLAYER);
      useGameStore.getState().setPlayerRole(ChipType.RUNNER);
      useGameStore.setState({ phase: GamePhase.CHASER_TURN });

      const state = useGameStore.getState();
      const initialChip = state.chips.find((c) => c.type === ChipType.CHASER);
      expect(initialChip).toBeDefined();
      
      const initialChipReference = initialChip!;
      const initialPositionReference = initialChip!.position;

      // Act: Execute AI turn
      state.executeAITurn();

      // Assert: Chip should be updated with new references
      const updatedState = useGameStore.getState();
      const updatedChip = updatedState.chips.find((c) => c.type === ChipType.CHASER);

      expect(updatedChip).toBeDefined();
      
      // PRESERVATION: AI moves create new chip object references
      expect(updatedChip).not.toBe(initialChipReference);
      
      // PRESERVATION: Position object is also new reference
      expect(updatedChip!.position).not.toBe(initialPositionReference);
      
      // Position should have changed (AI made a move)
      const positionChanged = 
        updatedChip!.position.x !== initialPositionReference.x ||
        updatedChip!.position.y !== initialPositionReference.y;
      expect(positionChanged).toBe(true);
    });

    it('should update chip positions and create new object references for AI runner moves', () => {
      // Arrange: Single player mode, player is CHASER (so AI plays RUNNERS)
      useGameStore.getState().setGameMode(GameMode.SINGLE_PLAYER);
      useGameStore.getState().setPlayerRole(ChipType.CHASER);
      useGameStore.setState({ phase: GamePhase.RUNNER_TURN });

      const state = useGameStore.getState();
      const initialRunners = state.chips.filter((c) => c.type === ChipType.RUNNER && c.isActive);
      
      const initialReferences = initialRunners.map((chip) => ({
        chipRef: chip,
        positionRef: chip.position,
        chipId: chip.id,
      }));

      // Act: Execute AI turn (all runners move)
      state.executeAITurn();

      // Assert: All runner chips should be updated with new references
      const updatedState = useGameStore.getState();
      
      initialReferences.forEach(({ chipRef, positionRef, chipId }) => {
        const updatedChip = updatedState.chips.find((c) => c.id === chipId);
        expect(updatedChip).toBeDefined();
        
        // PRESERVATION: AI runner moves create new chip object references
        expect(updatedChip).not.toBe(chipRef);
        
        // PRESERVATION: Position objects are also new references
        expect(updatedChip!.position).not.toBe(positionRef);
      });
    });
  });

  describe('Test 3: Hotseat moves continue to animate correctly', () => {
    it('should update chip position and create new object reference for hotseat chaser move', () => {
      // Arrange: Hotseat mode
      useGameStore.getState().setGameMode(GameMode.HOTSEAT);
      useGameStore.setState({ phase: GamePhase.CHASER_TURN });

      const state = useGameStore.getState();
      const initialChip = state.chips.find((c) => c.type === ChipType.CHASER);
      expect(initialChip).toBeDefined();
      
      const initialChipReference = initialChip!;
      const initialPositionReference = initialChip!.position;
      const initialPosition = initialChip!.position;

      // Act: Select chip and move it
      state.selectChip(initialChip!.id);
      
      // Move to valid position (60px away for chaser - exactly chip diameter * 2)
      // Calculate exact distance from initial position
      const distance = 60; // chaser radius (30) * 2
      const targetPosition = { x: initialPosition.x + distance, y: initialPosition.y };
      
      useGameStore.setState({
        phantomChip: {
          id: `phantom-${initialChip!.id}`,
          type: ChipType.CHASER,
          position: targetPosition,
          radius: initialChip!.radius,
          sourceChipId: initialChip!.id,
        },
      });
      
      state.confirmMove();

      // Assert: Chip should be updated with new references
      const updatedState = useGameStore.getState();
      const updatedChip = updatedState.chips.find((c) => c.type === ChipType.CHASER);

      expect(updatedChip).toBeDefined();
      
      // PRESERVATION: Hotseat moves create new chip object references
      expect(updatedChip).not.toBe(initialChipReference);
      
      // PRESERVATION: Position object is also new reference
      expect(updatedChip!.position).not.toBe(initialPositionReference);
      
      // Position values should be updated
      expect(updatedChip!.position.x).toBe(targetPosition.x);
      expect(updatedChip!.position.y).toBe(targetPosition.y);
    });

    it('should update chip position and create new object reference for hotseat runner move', () => {
      // Arrange: Hotseat mode
      useGameStore.getState().setGameMode(GameMode.HOTSEAT);
      useGameStore.setState({ phase: GamePhase.RUNNER_TURN });

      const state = useGameStore.getState();
      const initialChip = state.chips.find((c) => c.id === 'runner-2');
      expect(initialChip).toBeDefined();
      
      const initialChipReference = initialChip!;
      const initialPositionReference = initialChip!.position;

      // Act: Select chip and move it
      state.selectChip('runner-2');
      
      // Move to valid position (40px away)
      const targetPosition = { x: 340, y: 780 };
      useGameStore.setState({
        phantomChip: {
          id: 'phantom-runner-2',
          type: ChipType.RUNNER,
          position: targetPosition,
          radius: initialChip!.radius,
          sourceChipId: 'runner-2',
        },
      });
      
      state.confirmMove();

      // Assert: Chip should be updated with new references
      const updatedState = useGameStore.getState();
      const updatedChip = updatedState.chips.find((c) => c.id === 'runner-2');

      expect(updatedChip).toBeDefined();
      
      // PRESERVATION: Hotseat moves create new chip object references
      expect(updatedChip).not.toBe(initialChipReference);
      
      // PRESERVATION: Position object is also new reference
      expect(updatedChip!.position).not.toBe(initialPositionReference);
      
      // Position values should be updated
      expect(updatedChip!.position.x).toBe(340);
      expect(updatedChip!.position.y).toBe(780);
    });
  });

  describe('Test 4: Capture animations continue to work', () => {
    it('should mark runner as captured and create new object reference when chaser overlaps', () => {
      // Arrange: Hotseat mode, position chaser near a runner
      useGameStore.getState().setGameMode(GameMode.HOTSEAT);
      useGameStore.setState({ phase: GamePhase.CHASER_TURN });

      const state = useGameStore.getState();
      const chaserChip = state.chips.find((c) => c.type === ChipType.CHASER);
      const runnerChip = state.chips.find((c) => c.id === 'runner-0');
      
      expect(chaserChip).toBeDefined();
      expect(runnerChip).toBeDefined();

      // Position chaser close to runner for capture
      // Runner at (100, 780), move chaser to overlap
      useGameStore.setState({
        chips: state.chips.map((c) =>
          c.type === ChipType.CHASER
            ? { ...c, position: { x: 80, y: 780 } }
            : c
        ),
      });

      const initialRunnerReference = useGameStore.getState().chips.find((c) => c.id === 'runner-0');
      expect(initialRunnerReference!.isCaptured).toBeFalsy();

      // Act: Move chaser to capture runner
      const updatedState = useGameStore.getState();
      updatedState.selectChip(chaserChip!.id);
      
      // Move chaser to overlap runner (within capture distance)
      const targetPosition = { x: 100, y: 780 };
      useGameStore.setState({
        phantomChip: {
          id: `phantom-${chaserChip!.id}`,
          type: ChipType.CHASER,
          position: targetPosition,
          radius: chaserChip!.radius,
          sourceChipId: chaserChip!.id,
        },
      });
      
      updatedState.confirmMove();

      // Assert: Runner should be captured with new object reference
      const finalState = useGameStore.getState();
      const capturedRunner = finalState.chips.find((c) => c.id === 'runner-0');

      expect(capturedRunner).toBeDefined();
      
      // PRESERVATION: Captured runner gets new object reference
      expect(capturedRunner).not.toBe(initialRunnerReference);
      
      // PRESERVATION: Capture flag is set correctly
      expect(capturedRunner!.isCaptured).toBe(true);
      expect(capturedRunner!.isActive).toBe(false);
      
      // PRESERVATION: Chaser score increases
      expect(finalState.score.chaser).toBeGreaterThan(0);
    });
  });

  describe('Test 5: Score animations continue to work', () => {
    it('should award points and trigger animation when runner crosses scoring line', () => {
      // Arrange: Hotseat mode, position runner near scoring line
      useGameStore.getState().setGameMode(GameMode.HOTSEAT);
      useGameStore.setState({ phase: GamePhase.RUNNER_TURN });

      const state = useGameStore.getState();
      
      // Position runner just below first scoring line (y=760)
      // Initial position: (100, 780), move to (100, 740) to cross line
      useGameStore.setState({
        chips: state.chips.map((c) =>
          c.id === 'runner-0'
            ? { ...c, position: { x: 100, y: 770 }, crossedLines: [] }
            : c
        ),
      });

      const initialScore = useGameStore.getState().score.runner;
      const initialChip = useGameStore.getState().chips.find((c) => c.id === 'runner-0');
      const initialChipReference = initialChip!;

      // Act: Move runner across scoring line
      const updatedState = useGameStore.getState();
      updatedState.selectChip('runner-0');
      
      // Move across scoring line at y=760
      const targetPosition = { x: 100, y: 730 };
      useGameStore.setState({
        phantomChip: {
          id: 'phantom-runner-0',
          type: ChipType.RUNNER,
          position: targetPosition,
          radius: initialChip!.radius,
          sourceChipId: 'runner-0',
        },
      });
      
      updatedState.confirmMove();

      // Assert: Score should increase and chip should have new reference
      const finalState = useGameStore.getState();
      const updatedChip = finalState.chips.find((c) => c.id === 'runner-0');

      expect(updatedChip).toBeDefined();
      
      // PRESERVATION: Chip gets new object reference when crossing line
      expect(updatedChip).not.toBe(initialChipReference);
      
      // PRESERVATION: Score increases
      expect(finalState.score.runner).toBeGreaterThan(initialScore);
      
      // PRESERVATION: crossedLines array is updated with new reference
      expect(updatedChip!.crossedLines).not.toBe(initialChipReference!.crossedLines);
      expect(updatedChip!.crossedLines.length).toBeGreaterThan(0);
    });

    it('should award points when chaser crosses scoring line', () => {
      // Arrange: Hotseat mode, position chaser near scoring line
      useGameStore.getState().setGameMode(GameMode.HOTSEAT);
      useGameStore.setState({ phase: GamePhase.CHASER_TURN });

      const state = useGameStore.getState();
      const chaserChip = state.chips.find((c) => c.type === ChipType.CHASER);
      
      // Position chaser just above first scoring line (y=760)
      useGameStore.setState({
        chips: state.chips.map((c) =>
          c.type === ChipType.CHASER
            ? { ...c, position: { x: 300, y: 750 }, crossedLines: [] }
            : c
        ),
      });

      const initialScore = useGameStore.getState().score.chaser;
      const initialChip = useGameStore.getState().chips.find((c) => c.type === ChipType.CHASER);
      const initialChipReference = initialChip!;

      // Act: Move chaser across scoring line
      const updatedState = useGameStore.getState();
      updatedState.selectChip(chaserChip!.id);
      
      // Move across scoring line at y=760 (going down)
      const targetPosition = { x: 300, y: 790 };
      useGameStore.setState({
        phantomChip: {
          id: `phantom-${chaserChip!.id}`,
          type: ChipType.CHASER,
          position: targetPosition,
          radius: chaserChip!.radius,
          sourceChipId: chaserChip!.id,
        },
      });
      
      updatedState.confirmMove();

      // Assert: Score should increase and chip should have new reference
      const finalState = useGameStore.getState();
      const updatedChip = finalState.chips.find((c) => c.type === ChipType.CHASER);

      expect(updatedChip).toBeDefined();
      
      // PRESERVATION: Chip gets new object reference when crossing line
      expect(updatedChip).not.toBe(initialChipReference);
      
      // PRESERVATION: Score increases
      expect(finalState.score.chaser).toBeGreaterThan(initialScore);
      
      // PRESERVATION: crossedLines array is updated
      expect(updatedChip!.crossedLines.length).toBeGreaterThan(0);
    });
  });

  describe('Property-Based: Move validation continues to work correctly', () => {
    it('should reject invalid moves in all game modes', () => {
      const gameModes = [GameMode.SINGLE_PLAYER, GameMode.HOTSEAT, GameMode.ONLINE_MULTIPLAYER];

      gameModes.forEach((mode) => {
        // Arrange
        useGameStore.getState().initializeGame();
        useGameStore.getState().setGameMode(mode);
        useGameStore.getState().setPlayerRole(ChipType.RUNNER);
        useGameStore.setState({ phase: GamePhase.RUNNER_TURN });

        const state = useGameStore.getState();
        const initialChip = state.chips.find((c) => c.id === 'runner-0');
        const initialPosition = initialChip!.position;

        // Act: Try to move too far (invalid move)
        state.selectChip('runner-0');
        
        // Move 100px away (invalid - should be max 40px for runner)
        const invalidPosition = { x: initialPosition.x + 100, y: initialPosition.y };
        useGameStore.setState({
          phantomChip: {
            id: 'phantom-runner-0',
            type: ChipType.RUNNER,
            position: invalidPosition,
            radius: initialChip!.radius,
            sourceChipId: 'runner-0',
          },
        });
        
        // Mock console.warn to capture validation error
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        state.confirmMove();

        // Assert: Move should be rejected (validation error logged)
        expect(consoleWarnSpy).toHaveBeenCalled();
        
        // Position should not change
        const finalChip = useGameStore.getState().chips.find((c) => c.id === 'runner-0');
        expect(finalChip!.position).toEqual(initialPosition);

        consoleWarnSpy.mockRestore();
      });
    });
  });

  describe('Property-Based: Game state transitions continue correctly', () => {
    it('should transition from CHASER_TURN to RUNNER_TURN after chaser moves', () => {
      // Arrange: Hotseat mode
      useGameStore.getState().setGameMode(GameMode.HOTSEAT);
      useGameStore.setState({ phase: GamePhase.CHASER_TURN });

      const state = useGameStore.getState();
      const chaserChip = state.chips.find((c) => c.type === ChipType.CHASER);
      const initialPosition = chaserChip!.position;

      // Act: Make chaser move
      state.selectChip(chaserChip!.id);
      
      // Move exactly 60px away (chaser diameter)
      const distance = 60;
      const targetPosition = { x: initialPosition.x + distance, y: initialPosition.y };
      
      useGameStore.setState({
        phantomChip: {
          id: `phantom-${chaserChip!.id}`,
          type: ChipType.CHASER,
          position: targetPosition,
          radius: chaserChip!.radius,
          sourceChipId: chaserChip!.id,
        },
      });
      
      state.confirmMove();

      // Assert: Phase should transition to RUNNER_TURN
      const finalState = useGameStore.getState();
      expect(finalState.phase).toBe(GamePhase.RUNNER_TURN);
    });

    it('should transition from RUNNER_TURN to CHASER_TURN after all runners move', () => {
      // Arrange: Hotseat mode
      useGameStore.getState().setGameMode(GameMode.HOTSEAT);
      useGameStore.setState({ phase: GamePhase.RUNNER_TURN });

      const state = useGameStore.getState();
      const activeRunners = state.chips.filter((c) => c.type === ChipType.RUNNER && c.isActive);

      // Act: Move all runners
      activeRunners.forEach((runner) => {
        const currentState = useGameStore.getState();
        currentState.selectChip(runner.id);
        
        // Move 40px to the right
        const targetPosition = { x: runner.position.x + 40, y: runner.position.y };
        useGameStore.setState({
          phantomChip: {
            id: `phantom-${runner.id}`,
            type: ChipType.RUNNER,
            position: targetPosition,
            radius: runner.radius,
            sourceChipId: runner.id,
          },
        });
        
        currentState.confirmMove();
      });

      // Assert: Phase should transition to CHASER_TURN
      const finalState = useGameStore.getState();
      expect(finalState.phase).toBe(GamePhase.CHASER_TURN);
    });
  });
});
