
pair crease(pair z1, pair z2, bool left)
{
  pair dz = z2 - z1;

  if (left)
    return z1 + dz * (0.5, 0.5);
  else
    return z1 + dz * (0.5, -0.5);
}

pair[] fold(pair[] oldz)
{
  int n = oldz.length;
  pair[] newz = new pair[2n-1];

  for (int i = 0; i < n-1; ++i)
  {
    newz[2i] = oldz[i];
    newz[2i+1] = crease(oldz[i], oldz[i+1], i%2==0);
  }

  newz[2(n-1)] = oldz[n-1];

  return newz;
}

pair[] dragon(int n, pair[] base={})
{
/*  if (base == null)
    base = n%2 == 0 ? new pair[] {(0,0), (1,1)}
                    : new pair[] {(0,0), (1,0)}; */
  if (base.length == 0)
    if (n%2 == 0)
      base = new pair[] {(0,0), (1,1) };
    else
      base = new pair[] {(0,0), (1,0) };

  pair[] z = base;

  for (int i = 1; i < n; ++i)
    z = fold(z);

  return z;
}

void draw(pair[] z)
{
  int n = z.length;
  guide g;

  for (int i = 0; i < n; ++i) {
    g = g -- z[i];
  }

  draw(g);
}

void drawtris(pair[] z, pen p = currentpen)
{
  int n = z.length;

  for (int i = 0; i < n-2; i+=2)
    fill(z[i] -- z[i+1] -- z[i+2] -- cycle, p);
}

void drawtris(pair[] z, pen p1, pen p2)
{
  int n = z.length;

  for (int i = 0; i < n-2; i+=2)
    fill(z[i] -- z[i+1] -- z[i+2] -- cycle, 2i < n-1 ? p1 : p2);
}

void drawblocks(pair[] z, pen p1, pen p2)
{
  int n = z.length;

  for (int i = 0; i < n-2; i+=2) {
    pair z0 = z[i], z1 = z[i+1], z2 = z[i+2], z3 = z0+z2-z1; 
    path p = z0--z1--z2--z3--cycle;
    fill(p, 2i < n-1 ? p1 : p2);
    draw(p);
  }
}



size(500,0);

int n = 11;
drawblocks(dragon(n), orange, red);
drawtris(dragon(n, new pair[] {(0,0), (1,0)}), black);
drawtris(dragon(n, new pair[] {(0,0), (0,-1)}), blue);
drawtris(dragon(n, new pair[] {(0,0), (-1,0)}), red);
drawtris(dragon(n, new pair[] {(0,0), (0,1)}),  green);
shipout();
