/**
 * Tests for StepCard component.
 * Tests rendering of steps with images, fallbacks, and error states.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StepCard } from './StepCard';
import type { StepImage } from '../types/api'

describe('StepCard', () => {
    const createMockStep = (overrides: Partial<StepImage> = {}): StepImage => ({
        step_number: '1',
        title: 'First Step',
        description: 'This is the first step description',
        image_prompt: null,
        image: null,
        image_url: 'https://example.com/image.png',
        is_composite: false,
        panel_index: null,
        image_failed: false,
        fallback_text: null,
        ...overrides,
    })

    describe('Normal rendering', () => {
        it('renders step number and title', () => {
            const step = createMockStep({
                step_number: '2',
                title: 'Apply Bandage',
            })

            render(<StepCard step={step} />)

            expect(screen.getByText('Step 2')).toBeInTheDocument()
            expect(screen.getByText('Apply Bandage')).toBeInTheDocument()
        })

        it('renders step description', () => {
            const step = createMockStep({
                description: 'Carefully apply the bandage to the wound',
            })

            render(<StepCard step={step} />)

            expect(screen.getByText('Carefully apply the bandage to the wound')).toBeInTheDocument()
        })

        it('renders image with correct alt text', () => {
            const step = createMockStep({
                step_number: '3',
                title: 'Clean the wound',
                image_url: 'https://example.com/step3.png',
            })

            render(<StepCard step={step} />)

            const img = screen.getByAltText('Step 3: Clean the wound')
            expect(img).toBeInTheDocument()
            expect(img).toHaveAttribute('src', 'https://example.com/step3.png')
        })

        it('uses base64 image when image_url is not provided', () => {
            const step = createMockStep({
                image_url: null,
                image: 'base64ImageData',
            })

            render(<StepCard step={step} />)

            const img = screen.getByRole('img')
            expect(img).toHaveAttribute('src', 'data:image/png;base64,base64ImageData')
        })
    })

    describe('Image loading states', () => {
        it('shows loading placeholder initially', () => {
            const step = createMockStep({
                image_url: 'https://example.com/image.png',
            })

            render(<StepCard step={step} />)

            expect(screen.getByText('Loading visual guide...')).toBeInTheDocument()
        })

        it('hides loading placeholder after image loads', () => {
            const step = createMockStep({
                image_url: 'https://example.com/image.png',
            })

            render(<StepCard step={step} />)

            const img = screen.getByRole('img')
            fireEvent.load(img)

            expect(screen.queryByText('Loading visual guide...')).not.toBeInTheDocument()
        })
    })

    describe('Fallback states', () => {
        it('renders fallback panel when image_failed is true', () => {
            const step = createMockStep({
                image_failed: true,
                fallback_text: {
                    action: 'Apply pressure to wound',
                    method: 'Use clean cloth or bandage',
                    caution: 'Do not remove if bleeding stops',
                    result: 'Bleeding should slow within 5 minutes',
                },
            })

            render(<StepCard step={step} />)

            expect(screen.getByText('Apply pressure to wound')).toBeInTheDocument()
            expect(screen.getByText('Use clean cloth or bandage')).toBeInTheDocument()
            expect(screen.getByText('Do not remove if bleeding stops')).toBeInTheDocument()
            expect(screen.getByText('Bleeding should slow within 5 minutes')).toBeInTheDocument()
        })

        it('shows fallback panel labels', () => {
            const step = createMockStep({
                image_failed: true,
                fallback_text: {
                    action: 'Test action',
                    method: 'Test method',
                    caution: 'Test caution',
                    result: 'Test result',
                },
            })

            render(<StepCard step={step} />)

            expect(screen.getByText('Action')).toBeInTheDocument()
            expect(screen.getByText('Method')).toBeInTheDocument()
            expect(screen.getByText('⚠️ Caution')).toBeInTheDocument()
            expect(screen.getByText('✓ Expected Result')).toBeInTheDocument()
        })

        it('shows "Image not available" when no image or fallback', () => {
            const step = createMockStep({
                image_url: null,
                image: null,
                image_failed: false,
                fallback_text: null,
            })

            render(<StepCard step={step} />)

            expect(screen.getByText('Image not available')).toBeInTheDocument()
        })

        it('adds degraded class when image_failed', () => {
            const step = createMockStep({
                image_failed: true,
                fallback_text: {
                    action: 'Action',
                    method: 'Method',
                    caution: 'Caution',
                    result: 'Result',
                },
            })

            const { container } = render(<StepCard step={step} />)

            expect(container.querySelector('.step-card.degraded')).toBeInTheDocument()
        })
    })

    describe('Image error handling', () => {
        it('shows fallback when image fails to load', () => {
            const step = createMockStep({
                image_url: 'https://example.com/broken-image.png',
                fallback_text: {
                    action: 'Fallback action',
                    method: 'Fallback method',
                    caution: 'Fallback caution',
                    result: 'Fallback result',
                },
            })

            render(<StepCard step={step} />)

            const img = screen.getByRole('img')
            fireEvent.error(img)

            expect(screen.getByText('Fallback action')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('has proper heading structure', () => {
            const step = createMockStep({ title: 'Important Step' })

            render(<StepCard step={step} />)

            expect(screen.getByRole('heading', { name: 'Important Step' })).toBeInTheDocument()
        })

        it('image has lazy loading attribute', () => {
            const step = createMockStep({
                image_url: 'https://example.com/image.png',
            })

            render(<StepCard step={step} />)

            const img = screen.getByRole('img')
            expect(img).toHaveAttribute('loading', 'lazy')
        })
    })
})
