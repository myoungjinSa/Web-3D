extern "C" {
  int next_color_index(int current) {
    return (current + 1) % 4;
  }
}
