# Offer Version Control Research & Implementation Guide

**Date:** 2025-11  
**Status:** Research & Analysis  
**Purpose:** Evaluate version control implementation for offers in the application

## Executive Summary

This document researches the implementation of version control for offers in the application, analyzing 2025 best practices, implementation strategies, and the pros/cons of different approaches. The goal is to enable tracking of offer changes over time, maintaining a complete audit trail, and allowing users to revert to previous versions if needed.

## Current State Analysis

### Offer Data Structure

Based on the codebase analysis, offers contain the following data:

**Core Fields:**

- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `title` (string) - Offer title
- `industry` (string) - Industry classification
- `status` (enum) - draft, sent, accepted, lost, etc.
- `created_at` (timestamp) - Creation time
- `sent_at` (timestamp) - When offer was sent
- `decided_at` (timestamp) - When decision was made
- `decision` (enum) - accepted, lost
- `pdf_url` (string) - URL to generated PDF
- `recipient_id` (UUID) - Foreign key to clients

**JSONB Fields:**

- `inputs` (JSONB) - Contains:
  - `projectDetails` - Project description
  - `deadline` - Project deadline
  - `language` - Language code
  - `brandVoice` - Brand voice style
  - `style` - Content style (detailed/compact)
  - `templateId` - Template identifier
- `ai_text` (text/JSONB) - AI-generated HTML content
- `price_json` (JSONB) - Pricing table data (rows with name, qty, unit, unitPrice, vat)

### Current Update Patterns

1. **Status Updates:** Users can update offer status (draft → sent → accepted/lost)
2. **Decision Tracking:** Updates to `decision`, `decided_at` when offer is accepted/lost
3. **PDF Regeneration:** New PDFs can be generated, updating `pdf_url`
4. **No Content Versioning:** Currently, updates to offer content (title, inputs, ai_text, price_json) overwrite previous values without history

### Use Cases for Version Control

1. **Audit Trail:** Track all changes to offers for compliance and accountability
2. **Revert Changes:** Allow users to revert to previous versions if mistakes are made
3. **Comparison:** Compare different versions of an offer to see what changed
4. **Compliance:** Maintain immutable history for legal/compliance requirements
5. **Collaboration:** Track who made changes and when (if multi-user support is added)
6. **Analytics:** Analyze how offers evolve over time

## Best Practices for Document Version Control (2025)

### 1. Temporal Data Patterns

**Temporal Tables (SQL:2011 Standard):**

- Native PostgreSQL support for system-versioned temporal tables (PostgreSQL 12+)
- Automatically tracks valid time periods for each row
- Built-in query syntax for time-travel queries
- **Best for:** Compliance-heavy applications requiring standard SQL temporal queries

**Audit Tables:**

- Separate table storing historical versions
- Trigger-based or application-level inserts
- More flexible than temporal tables
- **Best for:** Applications needing custom versioning logic

**JSONB Snapshots:**

- Store complete offer state as JSONB in version table
- Simple to implement and query
- Can store metadata (who, when, why)
- **Best for:** Document-based systems with complex nested structures

### 2. Versioning Strategies

**Full Snapshot Approach:**

- Store complete copy of offer data for each version
- Simple to implement and restore
- Higher storage overhead
- **Best for:** Small to medium documents, infrequent updates

**Delta/Change Tracking:**

- Store only changed fields between versions
- Lower storage overhead
- More complex to reconstruct full versions
- **Best for:** Large documents, frequent updates

**Hybrid Approach:**

- Store full snapshots at milestones (e.g., sent, accepted)
- Store deltas for intermediate changes
- Balances storage and complexity
- **Best for:** Mixed update patterns

### 3. Version Identification

**Sequential Version Numbers:**

- Simple integer version numbers (v1, v2, v3)
- Easy to understand and display
- Can have gaps if versions are deleted

**Semantic Versioning:**

- Major.Minor.Patch (e.g., 1.2.3)
- Conveys significance of changes
- More complex to manage automatically

**Timestamp-Based:**

- Use creation timestamp as version identifier
- Naturally ordered
- Can be ambiguous if multiple versions created simultaneously

**Hash-Based:**

- Content hash (e.g., SHA-256) as version identifier
- Detects identical versions automatically
- Less human-readable

### 4. Storage Considerations

**Database Storage:**

- Store versions in PostgreSQL tables
- Leverage existing RLS policies
- Easy to query and index
- **Best for:** Structured data, relational queries

**Object Storage:**

- Store versions in object storage (S3, Supabase Storage)
- Lower database storage costs
- More complex to query
- **Best for:** Large files, infrequent access

**Hybrid Storage:**

- Metadata in database, large content in object storage
- Balances queryability and cost
- **Best for:** Offers with large PDFs or images

### 5. Retention Policies

**Keep All Versions:**

- Store all versions indefinitely
- Maximum audit trail
- Storage costs grow over time

**Time-Based Retention:**

- Delete versions older than X days/months
- Reduces storage costs
- May violate compliance requirements

**Status-Based Retention:**

- Keep all versions of sent/accepted offers
- Delete old versions of drafts
- Balances audit needs and storage

**Compression/Archival:**

- Compress old versions
- Archive to cold storage
- Reduces active storage costs

## Implementation Approaches

### Approach 1: Audit Table with Full Snapshots

**Structure:**

```sql
CREATE TABLE offer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_by UUID REFERENCES auth.users(id),
  change_reason TEXT, -- Optional: why was this version created
  is_current BOOLEAN NOT NULL DEFAULT false,

  -- Full snapshot of offer data
  title TEXT,
  industry TEXT,
  status TEXT,
  inputs JSONB,
  ai_text TEXT,
  price_json JSONB,
  recipient_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context

  UNIQUE(offer_id, version_number)
);

CREATE INDEX idx_offer_versions_offer_id ON offer_versions(offer_id, version_number DESC);
CREATE INDEX idx_offer_versions_created_at ON offer_versions(created_at DESC);
CREATE INDEX idx_offer_versions_current ON offer_versions(offer_id) WHERE is_current = true;
```

**Implementation:**

- Trigger on `offers` table to create version on INSERT/UPDATE
- Application logic to set `is_current = false` on old versions
- API endpoints to retrieve and restore versions

**Pros:**

- Simple to implement and understand
- Easy to query and restore versions
- Complete audit trail
- Works with existing RLS policies

**Cons:**

- Higher storage overhead (duplicates all data)
- No automatic deduplication of unchanged versions
- Manual version number management

### Approach 2: Temporal Tables (PostgreSQL 12+)

**Structure:**

```sql
-- Convert offers table to temporal table
ALTER TABLE offers ADD COLUMN sys_period TSTZRANGE;

CREATE TABLE offers_history (
  LIKE offers INCLUDING ALL
);

CREATE TRIGGER offers_versioning_trigger
  BEFORE UPDATE OR DELETE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION versioning('sys_period', 'offers_history', true);
```

**Implementation:**

- PostgreSQL automatically maintains history table
- Use temporal queries to access historical data
- `AS OF SYSTEM TIME` syntax for time-travel queries

**Pros:**

- Native PostgreSQL support
- Automatic versioning (no application logic needed)
- Standard SQL temporal queries
- Efficient storage (only stores changes)

**Cons:**

- Requires PostgreSQL 12+ (Supabase supports this)
- Less flexible than custom audit tables
- Harder to add custom metadata (who, why)
- Learning curve for temporal queries

### Approach 3: Event Sourcing Pattern

**Structure:**

```sql
CREATE TABLE offer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- created, updated, status_changed, etc.
  event_data JSONB NOT NULL, -- Changed fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_by UUID REFERENCES auth.users(id),
  event_metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_offer_events_offer_id ON offer_events(offer_id, created_at DESC);
```

**Implementation:**

- Store all changes as events
- Reconstruct current state by replaying events
- Can rebuild any version by replaying events up to that point
- Snapshot periodically for performance

**Pros:**

- Complete audit trail of all changes
- Can reconstruct any version
- Supports complex business logic
- Natural fit for event-driven architectures

**Cons:**

- More complex to implement
- Requires event replay logic
- May need snapshots for performance
- Overkill for simple versioning needs

### Approach 4: Hybrid: Snapshots + Deltas

**Structure:**

```sql
CREATE TABLE offer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_type TEXT NOT NULL, -- 'snapshot' or 'delta'
  parent_version_id UUID REFERENCES offer_versions(id), -- For deltas
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_by UUID REFERENCES auth.users(id),

  -- Full snapshot (for snapshot versions)
  snapshot_data JSONB,

  -- Delta (for delta versions)
  delta_data JSONB, -- Only changed fields

  UNIQUE(offer_id, version_number)
);
```

**Implementation:**

- Create snapshots at milestones (sent, accepted)
- Create deltas for intermediate changes
- Reconstruct versions by applying deltas to snapshot
- Cache reconstructed versions

**Pros:**

- Balances storage and complexity
- Efficient for frequent small changes
- Complete history at milestones
- Flexible versioning strategy

**Cons:**

- More complex to implement
- Requires delta application logic
- Potential performance issues with many deltas
- Cache invalidation complexity

## Recommended Implementation for This Application

### Recommended Approach: Audit Table with Full Snapshots + Smart Versioning

**Rationale:**

1. **Simplicity:** Easy to implement and maintain
2. **Queryability:** Simple SQL queries for version history
3. **RLS Compatible:** Works with existing Row Level Security
4. **Storage:** Acceptable for offer documents (not too large)
5. **Flexibility:** Can add custom metadata (who, why, change notes)

### Implementation Plan

#### Phase 1: Database Schema

```sql
-- Create offer_versions table
CREATE TABLE offer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_by UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL DEFAULT 'update', -- created, updated, status_changed, regenerated
  change_reason TEXT, -- Optional: user-provided reason
  is_current BOOLEAN NOT NULL DEFAULT false,

  -- Full snapshot of offer data at this version
  title TEXT,
  industry TEXT,
  status TEXT,
  inputs JSONB,
  ai_text TEXT,
  price_json JSONB,
  recipient_id UUID,
  pdf_url TEXT, -- PDF URL at time of version

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context, change summary, etc.

  CONSTRAINT offer_versions_offer_version_unique UNIQUE(offer_id, version_number)
);

-- Indexes for efficient querying
CREATE INDEX idx_offer_versions_offer_id ON offer_versions(offer_id, version_number DESC);
CREATE INDEX idx_offer_versions_created_at ON offer_versions(created_at DESC);
CREATE INDEX idx_offer_versions_current ON offer_versions(offer_id) WHERE is_current = true;
CREATE INDEX idx_offer_versions_change_type ON offer_versions(offer_id, change_type);

-- Enable RLS
ALTER TABLE offer_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view versions of their offers"
  ON offer_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = offer_versions.offer_id
      AND offers.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all versions"
  ON offer_versions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

#### Phase 2: Version Creation Logic

**Trigger-Based Approach (Automatic):**

```sql
-- Function to create version on offer update
CREATE OR REPLACE FUNCTION create_offer_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
  old_data RECORD;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM offer_versions
  WHERE offer_id = NEW.id;

  -- Mark old current version as not current
  UPDATE offer_versions
  SET is_current = false
  WHERE offer_id = NEW.id AND is_current = true;

  -- Determine change type
  DECLARE
    change_type TEXT := 'updated';
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      change_type := 'status_changed';
    ELSIF OLD.pdf_url IS DISTINCT FROM NEW.pdf_url THEN
      change_type := 'regenerated';
    END IF;

    -- Create new version
    INSERT INTO offer_versions (
      offer_id,
      version_number,
      created_by,
      change_type,
      is_current,
      title,
      industry,
      status,
      inputs,
      ai_text,
      price_json,
      recipient_id,
      pdf_url
    ) VALUES (
      NEW.id,
      next_version,
      NEW.user_id, -- Assuming user_id is available in trigger context
      change_type,
      true,
      NEW.title,
      NEW.industry,
      NEW.status,
      NEW.inputs,
      NEW.ai_text,
      NEW.price_json,
      NEW.recipient_id,
      NEW.pdf_url
    );
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updates
CREATE TRIGGER offer_version_trigger
  AFTER UPDATE ON offers
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*) -- Only create version if something changed
  EXECUTE FUNCTION create_offer_version();

-- Trigger for inserts (create initial version)
CREATE OR REPLACE FUNCTION create_initial_offer_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO offer_versions (
    offer_id,
    version_number,
    created_by,
    change_type,
    is_current,
    title,
    industry,
    status,
    inputs,
    ai_text,
    price_json,
    recipient_id,
    pdf_url
  ) VALUES (
    NEW.id,
    1,
    NEW.user_id,
    'created',
    true,
    NEW.title,
    NEW.industry,
    NEW.status,
    NEW.inputs,
    NEW.ai_text,
    NEW.price_json,
    NEW.recipient_id,
    NEW.pdf_url
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER offer_initial_version_trigger
  AFTER INSERT ON offers
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_offer_version();
```

**Application-Based Approach (More Control):**

- Create versions explicitly in application code
- More control over when versions are created
- Can add user-provided change reasons
- Better for conditional versioning (e.g., only version on significant changes)

#### Phase 3: API Endpoints

```typescript
// GET /api/offers/[offerId]/versions
// List all versions of an offer
export async function GET(req: Request, { params }: { params: { offerId: string } }) {
  const versions = await supabase
    .from('offer_versions')
    .select('*')
    .eq('offer_id', params.offerId)
    .order('version_number', { ascending: false });

  return NextResponse.json(versions);
}

// GET /api/offers/[offerId]/versions/[versionNumber]
// Get specific version
export async function GET(
  req: Request,
  { params }: { params: { offerId: string; versionNumber: string } },
) {
  const version = await supabase
    .from('offer_versions')
    .select('*')
    .eq('offer_id', params.offerId)
    .eq('version_number', parseInt(params.versionNumber))
    .single();

  return NextResponse.json(version);
}

// POST /api/offers/[offerId]/versions/[versionNumber]/restore
// Restore offer to specific version
export async function POST(
  req: Request,
  { params }: { params: { offerId: string; versionNumber: string } },
) {
  // 1. Get version data
  const version = await supabase
    .from('offer_versions')
    .select('*')
    .eq('offer_id', params.offerId)
    .eq('version_number', parseInt(params.versionNumber))
    .single();

  // 2. Create new version from current state (for rollback capability)
  // 3. Restore offer to version state
  await supabase
    .from('offers')
    .update({
      title: version.title,
      industry: version.industry,
      status: version.status,
      inputs: version.inputs,
      ai_text: version.ai_text,
      price_json: version.price_json,
      recipient_id: version.recipient_id,
      pdf_url: version.pdf_url,
    })
    .eq('id', params.offerId);

  // 4. Trigger will create new version automatically
  // Or create version manually with change_type = 'restored'

  return NextResponse.json({ success: true });
}
```

#### Phase 4: UI Components

1. **Version History View:**
   - List all versions with timestamps, change types, and previews
   - Allow filtering by change type
   - Show diff between versions

2. **Version Comparison:**
   - Side-by-side comparison of two versions
   - Highlight differences in content, pricing, etc.

3. **Restore Dialog:**
   - Confirm restore action
   - Option to add restore reason
   - Preview what will be restored

4. **Version Badge:**
   - Show current version number in offer view
   - Link to version history

## Pros and Cons Analysis

### Pros of Implementing Version Control

1. **Audit Trail:**
   - Complete history of all changes
   - Compliance with data retention requirements
   - Accountability for changes

2. **Error Recovery:**
   - Users can revert accidental changes
   - Restore previous versions if mistakes are made
   - Peace of mind when editing offers

3. **Analytics:**
   - Track how offers evolve over time
   - Analyze which changes lead to acceptance
   - Understand user editing patterns

4. **Collaboration (Future):**
   - Track who made changes (if multi-user support added)
   - See change history in team environments
   - Resolve conflicts by comparing versions

5. **Compliance:**
   - Legal requirements for document versioning
   - Regulatory compliance (GDPR, etc.)
   - Immutable audit trail

6. **User Confidence:**
   - Users feel safer making changes
   - Can experiment with edits knowing they can revert
   - Professional feature that increases trust

### Cons of Implementing Version Control

1. **Storage Costs:**
   - Duplicate storage for each version
   - Storage costs grow with number of versions
   - May need retention policies to manage costs

2. **Complexity:**
   - Additional database tables and logic
   - More complex queries and API endpoints
   - UI complexity for version management

3. **Performance:**
   - Additional database writes on each update
   - Slower updates due to version creation
   - More complex queries for version history

4. **Development Time:**
   - Time to implement versioning logic
   - UI components for version management
   - Testing and maintenance

5. **User Confusion:**
   - Users may not understand versioning
   - Need to educate users on how to use versions
   - Potential for accidental version creation

6. **Migration Complexity:**
   - Need to migrate existing offers (create initial versions)
   - Backfill version history for existing data
   - Handle edge cases in migration

## Storage Cost Estimation

### Assumptions:

- Average offer size: ~50KB (title, inputs, ai_text, price_json)
- Average number of versions per offer: 5
- Number of offers: 10,000
- Storage cost: $0.021 per GB/month (Supabase)

### Calculation:

- Storage per offer: 50KB × 5 versions = 250KB
- Total storage: 10,000 offers × 250KB = 2.5GB
- Monthly cost: 2.5GB × $0.021 = $0.0525/month

### With Retention Policy:

- Keep versions for sent/accepted offers indefinitely
- Delete old versions of drafts after 30 days
- Estimated reduction: 50-70% storage savings

## Recommendations

### Immediate Actions (Phase 1)

1. **Implement Audit Table Approach:**
   - Create `offer_versions` table
   - Implement trigger-based versioning
   - Add RLS policies

2. **Create Initial Versions:**
   - Migrate existing offers to create version 1
   - Backfill version history if needed

3. **Add API Endpoints:**
   - List versions endpoint
   - Get version endpoint
   - Restore version endpoint

### Short-term (Phase 2)

1. **UI Components:**
   - Version history view
   - Version comparison tool
   - Restore functionality

2. **Smart Versioning:**
   - Only create versions on significant changes
   - Skip versions for minor updates (e.g., status only)
   - Add user-controlled versioning option

3. **Retention Policies:**
   - Implement time-based retention for drafts
   - Keep all versions for sent/accepted offers
   - Archive old versions to reduce storage

### Long-term (Phase 3)

1. **Advanced Features:**
   - Version diff visualization
   - Change summaries (what changed between versions)
   - Version tags/labels
   - Version comments/notes

2. **Analytics:**
   - Track version creation patterns
   - Analyze which changes lead to acceptance
   - Version usage metrics

3. **Optimization:**
   - Implement compression for old versions
   - Move old versions to object storage
   - Optimize queries with materialized views

## Alternative: Lightweight Versioning

If full version control is too complex, consider a lightweight approach:

1. **Snapshot on Status Change:**
   - Only create versions when status changes (draft → sent → accepted)
   - Store current state as snapshot
   - Simpler implementation, less storage

2. **Change Log:**
   - Simple log of changes (field, old value, new value, timestamp)
   - No full version restoration
   - Minimal storage, basic audit trail

3. **PDF Versioning:**
   - Version PDFs only (keep old PDFs)
   - No content versioning
   - Simple, addresses main use case

## Conclusion

Version control for offers is a valuable feature that provides:

- **Audit trail** for compliance and accountability
- **Error recovery** for users
- **Analytics** for understanding offer evolution
- **Professional feature** that increases user trust

The **recommended approach** is an **audit table with full snapshots** because it:

- Is simple to implement and maintain
- Works with existing RLS policies
- Provides complete version history
- Allows easy version restoration
- Has acceptable storage costs

**Implementation priority:** Medium-High

- Valuable feature for users
- Moderate complexity
- Acceptable storage costs
- Good ROI for user satisfaction and compliance

## References

1. PostgreSQL Temporal Tables: https://www.postgresql.org/docs/current/ddl-system-columns.html
2. SQL:2011 Temporal Standard: https://en.wikipedia.org/wiki/SQL:2011
3. Event Sourcing Pattern: https://martinfowler.com/eaaDev/EventSourcing.html
4. Database Versioning Best Practices: https://www.postgresql.org/docs/current/tutorial-window.html
5. Supabase Storage Pricing: https://supabase.com/pricing

## Next Steps

1. **Review this document** with the team
2. **Decide on implementation approach** (audit table recommended)
3. **Create implementation plan** with phases
4. **Design database schema** and migrations
5. **Implement API endpoints** for version management
6. **Build UI components** for version history
7. **Test thoroughly** with real offer data
8. **Deploy gradually** (feature flag, beta testing)
9. **Monitor storage costs** and adjust retention policies
10. **Gather user feedback** and iterate
