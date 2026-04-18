import { render, screen } from '@testing-library/react';
import App from './App';

test('renders investigation dashboard', () => {
  render(<App />);
  const headingElement = screen.getByText(/Missing Podo/i);
  expect(headingElement).toBeInTheDocument();
});
