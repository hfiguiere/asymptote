/*****
 * drawpath.cc
 * Andy Hammerlindl 2002/06/06
 *
 * Stores a path that has been added to a picture.
 *****/

#include <sstream>
#include <vector>
#include <cfloat>

#include "drawpath.h"
#include "psfile.h"
#include "util.h"

using std::ostringstream;
using std::istringstream;
using std::vector;

namespace camp {

void drawPath::adjustdash(pen& pen0)
{
  // Adjust dash sizes to fit arclength; also compensate for linewidth.
  string stroke=pen0.stroke();
  if(stroke != "") {
    double arclength=p.arclength();
    
    if(arclength) {
      vector<double> pat;
      {
        istringstream buf(stroke);
        double l;
        while(buf >> l) {
          pat.push_back(l);
        }
      }
      
      size_t n=pat.size();
      double sum=0.0;
      double penwidth=pen0.width();
      for(unsigned int i=0; i < n; i ++) {
	pat[i] *= penwidth;
	sum += pat[i];
      }
      
      // Fix bounding box resolution problem. Example:
      // asy -f pdf examples/testlinetype; gv -scale -2 testlinetype.pdf
      if(!p.cyclic() && pat[0] == 0) sum += 1.0e-3*penwidth;
      
      int ncycle=max((int)(arclength/sum+0.5),1);
      double factor=arclength/(ncycle*sum+(p.cyclic() ? 0.0 : pat[0]));
      ostringstream buf;
      for(unsigned int i=0; i < n; i++) buf << pat[i]*factor << " ";
      pen0.setstroke(buf.str());
    }
  }
}  

void drawPath::bounds(bbox& b, iopipestream&, std::vector<box>&)
{
  b += pad(p.bounds(), pentype.bounds());
}

bool drawPath::draw(psfile *out)
{
  int n = p.size();
  if (n == 0 || pentype.width() == 0.0 || pentype.transparent())
    return true;

  pen pen0=pentype;
  adjustdash(pen0);
  out->setpen(pen0);

  penStart(out);
  penTranslate(out);

  out->write(p);

  penConcat(out);

  out->stroke();

  penEnd(out);

  return true;
}

drawElement *drawPath::transformed(const transform& t)
{
  return new drawPath(transpath(t), transpen(t));
}

} //namespace camp
