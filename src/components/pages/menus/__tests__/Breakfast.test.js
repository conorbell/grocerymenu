import { render, screen } from '@testing-library/react';
import Breakfast from '../Breakfast.jsx';

test('breakfast component render', () => {
  render(<Breakfast />);
  const linkElement = screen.getByText();
  expect(linkElement).toBeInDocument();
});
