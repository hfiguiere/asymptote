layout(local_size_x=1) in;

uniform uint nElements;

layout(binding=0) buffer Sum
{
  uint sum[];
};

layout(binding=1) buffer Data
{
  uint data[];
};

uint ceilquotient(uint a, uint b)
{
  return (a+b-1u)/b;
}

void main(void)
{
  uint id=gl_GlobalInvocationID.x;

  uint m=ceilquotient(nElements,gl_NumWorkGroups.x);
  uint row=m*id;
  uint col=min(m,nElements-row);
  uint stop=row+col;

  uint Sum=data[row];
  for(uint i=row+1u; i < stop; ++i)
    Sum += data[i];

  sum[id]=Sum;
}