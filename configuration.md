# Proposal for configuring supported

Teams may want to customize the parameters of a support policy. For instance, a team may want to ignore certain dependencies, i.e. not enforce upgrades for certain dependencies. They may also want different upgrade cadences for specific dependencies. Lastly, in many cases, simply turning on a support policy and expecting consumers to immediately adhere to the policy is untenable (for instance, a major upgrade with a migration may be emminently required shortly after turning on a support policy). There needs to be a way to provide a grace period for onboarding to the support policy, while still providing a warning for when dependencies must be updated.

We will not require a configuration file, and will default to 4, 2, and 1 quarter upgrade periods for major, minor, and patch versions respectively.

```JSON
{
  "primary": {
    "upgradeBudget": {
      "major": 4,
      "minor": 4
    }
  }
}
```

```TypeScript
type Quarter = number;
type Weeks = number;
type DateString = string // month/day/year for instance "12/25/2021"

interface UpgradeBudget {
  major: Quarters;
  minor: Quarters;
  patch: Quarters;

  // Any releases that happen within this number of weeks of the end of a quarter
  // are considered to have been released the next quarter
  tailGracePeriod?: Weeks;
}

interface Policy {
  // Fallback to default 4, 2, 1 budget with no tailGracePeriod.
  upgradeBudget?: UpgradeBudget;
  
  // Used for easing users into a new policy: the support policy will act as
  // if all versions of dependencies were released on this date if the actual
  // release date is before the date. Users will be warned of the effective
  // deprecation date whenever the support policy tool is run.
  effectiveReleaseDate?: DateString;
}

interface PrimaryPolicy extends Policy {
  // If we ignore a dependency, that means that the given package will not affect
  // whether or not a consumer is within the support policy
  ignoredDependencies?: string[];
}

interface CustomPolicy extends Policy {
  // A whitelist of packages that are looked at for this policy
  dependencies: string[];
}

interface PolicyConfiguration {
  primary?: PrimaryPolicy
  custom?: CustomPolicy[]
}
```

### Conflicts
We should evaluate the config file up front and throw if there are conflicts. We should also throw if there are no policies defined.

* The same package cannot be in multiple `CustomPolicy` configs
* A `CustomPolicy` cannot list a package ignored by the primary policy

### `effectiveReleaseDate`
This configuration is designed to be used when rolling out a support policy. If you were to simply turn on a support policy, for example on `July 1st 2021`, and package `foo` had released version `2.0.0` on `August 1st 2020`, than consumers of `foo` still on `foo@1.x` would only have 1 quarter to upgrade `foo` from `1.x` to `2.x`. In this scenario, you would want to set `effectiveReleaseDate` to `7/1/2021`, which will cause the support policy tool to act as if all dependency versions were released on that that date, meaning that consumers would not need to upgrade to `2.x` until `10/1/2022`, giving them 4 full quarters to upgrade to a major version, which is the intent of the policy.

## Examples

#### Ignoring TypeScript

Since `typescript` doesn't exactly confirm to a normal semver policy, orgs might want to ignore it for determining support.

```JSON
{
  "primary": {
    "ignoredDependencies": ["typescript"]
  }
}
```

#### Separate cadence for TypeScript

Alternatively, you may want to treat any release as a major upgrade, thus any release would have a 1 year upgrade period.

```JSON
{
  "custom": [{
    "dependencies": ["typescript"],
    "upgradeBudget": {
      "major": 4,
      "minor": 4,
      "patch": 4
    }
  }]
}
```

## Alternatives

We could support policies that are relative to time intervals other than quarters, like months, years, or weeks.