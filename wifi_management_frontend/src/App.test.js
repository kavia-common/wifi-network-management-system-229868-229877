import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders sidebar navigation", () => {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/networks/i)).toBeInTheDocument();
  expect(screen.getByText(/clients/i)).toBeInTheDocument();
  expect(screen.getByText(/settings/i)).toBeInTheDocument();
});
